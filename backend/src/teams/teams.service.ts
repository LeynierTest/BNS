import { TeamsEventsService } from './teams-events.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QualificationService } from '../qualification/qualification.service';
import {
  assertSeasonNotStarted,
  resolveSeasonId,
} from '../seasons/season-scope';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService,
    private readonly teamsEventsService: TeamsEventsService,
    private readonly qualificationService: QualificationService) {}

  async getAllTeams() {
    return this.prisma.team.findMany({
      orderBy: {
        team_id: 'asc',
      },
    });
  }

  async searchTeams(
    name?: string,
    province?: string,
    color?: string,
    mascot?: string,
    championshipsParticipated?: number,
    championshipsWon?: number,
  ) {
    return this.prisma.$queryRaw`
      SELECT *
      FROM search_teams(
        p_name => ${name ?? null},
        p_province => ${province ?? null},
        p_color => ${color ?? null},
        p_mascot => ${mascot ?? null},
        p_championships_participated => ${championshipsParticipated ?? null},
        p_championships_won => ${championshipsWon ?? null}
      )
    `;
  }

  async getTeamById(id: number) {
    const team = await this.prisma.team.findUnique({
      where: {
        team_id: id,
      },
    });

    if (!team) {
      throw new NotFoundException(`El equipo con ID ${id} no existe`);
    }

    return team;
  }

  async createTeam(data: CreateTeamDto) {
    if (
      data.championships_won >
      data.championships_participated
    ) {
      throw new BadRequestException(
        'Los campeonatos ganados no pueden ser mayores que los campeonatos participados',
      );
    }

    // Decisión del equipo: un equipo nuevo se inscribe en la temporada
    // (la indicada o la más reciente) y solo antes de que empiece, para no
    // entrar en una competición en curso.
    const { season_id: requestedSeasonId, ...teamData } = data;
    const seasonId = await resolveSeasonId(this.prisma, requestedSeasonId);

    const createdTeam = await this.qualificationService.runLocked(
      async (tx) => {
        await assertSeasonNotStarted(tx, seasonId, 'añadir equipos');

        const team = await tx.team.create({
          data: teamData,
        });

        await tx.season_team.create({
          data: { season_id: seasonId, team_id: team.team_id },
        });

        return team;
      },
    );

    this.teamsEventsService.emit('team.created', createdTeam);

    return createdTeam;
  }

  async updateTeam(id: number, data: UpdateTeamDto) {
    const team = await this.getTeamById(id);

    const championshipsParticipated =
      data.championships_participated ??
      team.championships_participated;

    const championshipsWon =
      data.championships_won ??
      team.championships_won;

    if (championshipsWon > championshipsParticipated) {
      throw new BadRequestException(
        'Los campeonatos ganados no pueden ser mayores que los campeonatos participados',
      );
    }

    const updatedTeam = await this.prisma.team.update({
      where: {
        team_id: id,
      },
      data,
    });

    this.teamsEventsService.emit('team.updated', updatedTeam);

    return updatedTeam;
  }

  /**
   * Solo se elimina un equipo sin historial (p. ej. creado por error). Sus
   * peloteros y partidos forman parte de la Serie: borrarlos en cascada
   * cambiaría la tabla, los reportes y la clasificación de los demás
   * equipos, así que se rechaza explicando qué lo impide. Tampoco si está
   * inscrito en una temporada ya empezada (cambiaría quién la juega). La
   * comprobación corre con el bloqueo de escrituras de la Serie (las altas
   * de partidos lo toman); las claves foráneas cubren el resto.
   */
  async deleteTeam(id: number) {
    const team = await this.getTeamById(id);

    const deletedTeam = await this.qualificationService.runLocked(
      async (tx) => {
        const [members, matches, seasons] = await Promise.all([
          tx.team_member.count({
            where: {
              team_id: id,
            },
          }),
          tx.match.count({
            where: {
              OR: [{ away_team_id: id }, { home_team_id: id }],
            },
          }),
          tx.season_team.findMany({
            where: { team_id: id },
            select: { season_id: true },
          }),
        ]);

        if (members > 0 || matches > 0) {
          const history = [
            members > 0 &&
              `${members} ${members === 1 ? 'pelotero' : 'peloteros'}`,
            matches > 0 &&
              `${matches} ${matches === 1 ? 'partido' : 'partidos'}`,
          ]
            .filter(Boolean)
            .join(' y ');

          throw new BadRequestException(
            `No se puede eliminar ${team.name} porque tiene historial en la Serie (${history}). Solo se puede eliminar un equipo sin peloteros ni partidos`,
          );
        }

        for (const { season_id } of seasons) {
          await assertSeasonNotStarted(tx, season_id, `eliminar ${team.name}`);
        }

        return tx.team.delete({
          where: {
            team_id: id,
          },
        });
      },
    );

    this.teamsEventsService.emit('team.deleted', deletedTeam);

    return deletedTeam;
  }
}
