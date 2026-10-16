import { TeamsEventsService } from './teams-events.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService,
    private readonly teamsEventsService: TeamsEventsService) {}

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

    const createdTeam = await this.prisma.team.create({
      data,
    });

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

  async deleteTeam(id: number) {
  const canDelete = await this.canDeleteTeam(id);

  if (!canDelete) {
    throw new BadRequestException(
      'Este equipo no se puede eliminar porque tiene peloteros o partidos relacionados',
    );
  }

  const deletedTeam = await this.prisma.team.delete({
    where: {
      team_id: id,
    },
  });

  this.teamsEventsService.emit('team.deleted', deletedTeam);

  return deletedTeam;
}

  async canDeleteTeam(id: number): Promise<boolean> {
  const team = await this.getTeamById(id);

  const [playersCount, matchesCount] =
    await Promise.all([
      this.prisma.team_member.count({
        where: {
          team_id: team.team_id,
        },
      }),

      this.prisma.match.count({
        where: {
          OR: [
            {
              away_team_id: team.team_id,
            },
            {
              home_team_id: team.team_id,
            },
          ],
        },
      }),
    ]);

  return (
    playersCount === 0 &&
    matchesCount === 0
  );
}
}
