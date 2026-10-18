import { PlayersEventsService } from './players-events.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { isPitcherPosition } from './player-positions';

const PITCHING_FIELDS = [
  'innings_pitched',
  'runs_allowed',
  'hits_allowed',
  'walks_allowed',
  'strikeouts',
  'home_runs_allowed',
  'hit_batsmen',
] as const;

const BATTING_FIELDS = ['at_bats', 'hits'] as const;

type PlayerStatistics = Partial<
  Record<
    | (typeof PITCHING_FIELDS)[number]
    | (typeof BATTING_FIELDS)[number]
    | 'batting_average',
    number | Prisma.Decimal | null
  >
>;

function formatFields(fields: readonly string[]) {
  return fields.length <= 1
    ? fields.join('')
    : `${fields.slice(0, -1).join(', ')} y ${fields[fields.length - 1]}`;
}

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService,
    private readonly playersEventsService: PlayersEventsService) {}

  async getAllPlayers() {
    return this.prisma.player.findMany({
      orderBy: {
        team_member_id: 'asc',
      },
      include: {
        team_member: {
          include: {
            team: true,
          },
        },
      },
    });
  }

  async searchPlayers(
    number?: number,
    name?: string,
    team?: string,
    position?: string,
  ) {
    return this.prisma.$queryRaw`
      SELECT *
      FROM search_players(
        p_number => ${number ?? null},
        p_name => ${name ?? null},
        p_team => ${team ?? null},
        p_position => ${position ?? null}
      )
    `;
  }

  async getPlayerById(id: number) {
    const player = await this.prisma.player.findUnique({
      where: {
        team_member_id: id,
      },
      include: {
        team_member: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!player) {
      throw new NotFoundException(
        `El jugador con ID ${id} no existe`,
      );
    }

    return player;
  }

  /**
   * Cada posición lleva sus estadísticas (misma regla que el trigger
   * validate_player_stats): los lanzadores, las de pitcheo y no el promedio
   * de bateo, porque su promedio es el ERA, que se calcula; el resto, turnos
   * al bate, hits y promedio de bateo.
   */
  private validatePlayerStatistics(
    position: string,
    data: PlayerStatistics,
  ) {
    const present = (field: keyof PlayerStatistics) =>
      data[field] !== null && data[field] !== undefined;

    if (isPitcherPosition(position)) {
      const missing = PITCHING_FIELDS.filter((field) => !present(field));

      if (missing.length > 0) {
        throw new BadRequestException(
          `Los lanzadores deben tener ${formatFields(missing)}`,
        );
      }

      const forbidden = [...BATTING_FIELDS, 'batting_average' as const].filter(
        present,
      );

      if (forbidden.length > 0) {
        throw new BadRequestException(
          `Los lanzadores no pueden tener ${formatFields(forbidden)}: su promedio es el ERA, que se calcula con innings_pitched y runs_allowed`,
        );
      }

      if (Number(data.home_runs_allowed) > Number(data.hits_allowed)) {
        throw new BadRequestException(
          'home_runs_allowed no puede ser mayor que hits_allowed: todo jonrón es un hit',
        );
      }

      return;
    }

    const missing = [...BATTING_FIELDS, 'batting_average' as const].filter(
      (field) => !present(field),
    );

    if (missing.length > 0) {
      throw new BadRequestException(
        `Los jugadores que no son lanzadores deben tener ${formatFields(missing)}`,
      );
    }

    const forbidden = PITCHING_FIELDS.filter(present);

    if (forbidden.length > 0) {
      throw new BadRequestException(
        `Los jugadores que no son lanzadores no pueden tener ${formatFields(forbidden)}`,
      );
    }
  }

  async createPlayer(data: CreatePlayerDto) {
    const team = await this.prisma.team.findUnique({
      where: {
        team_id: data.team_id,
      },
    });

    if (!team) {
      throw new NotFoundException(
        `El equipo con ID ${data.team_id} no existe`,
      );
    }

    this.validatePlayerStatistics(data.position, data);

    try {
      const createdPlayer = await this.prisma.$transaction(
        async (tx) => {
          const teamMember = await tx.team_member.create({
            data: {
              name: data.name,
              number: data.number,
              years_on_team: data.years_on_team,
              team_id: data.team_id,
            },
          });

          return tx.player.create({
            data: {
              team_member_id: teamMember.team_member_id,
              position: data.position,
              at_bats: data.at_bats,
              innings_pitched: data.innings_pitched,
              hits: data.hits,
              runs_allowed: data.runs_allowed,
              batting_average: isPitcherPosition(data.position)
                ? null
                : data.batting_average,
              hits_allowed: data.hits_allowed,
              walks_allowed: data.walks_allowed,
              strikeouts: data.strikeouts,
              home_runs_allowed: data.home_runs_allowed,
              hit_batsmen: data.hit_batsmen,
            },
            include: {
              team_member: {
                include: {
                  team: true,
                },
              },
            },
          });
        },
      );

      this.playersEventsService.emit('player.created', createdPlayer);

      return createdPlayer;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          `El número ${data.number} ya está registrado para el equipo ${data.team_id}`,
        );
      }

      throw error;
    }
  }

  async updatePlayer(
    id: number,
    data: UpdatePlayerDto,
  ) {
    const currentPlayer = await this.getPlayerById(id);

    const position =
      data.position !== undefined
        ? data.position
        : currentPlayer.position;

    const pick = <Field extends keyof PlayerStatistics>(field: Field) =>
      data[field] !== undefined ? data[field] : currentPlayer[field];
    const pitcher = isPitcherPosition(position);

    const statistics: PlayerStatistics = {
      at_bats: pick('at_bats'),
      hits: pick('hits'),
      innings_pitched: pick('innings_pitched'),
      runs_allowed: pick('runs_allowed'),
      hits_allowed: pick('hits_allowed'),
      walks_allowed: pick('walks_allowed'),
      strikeouts: pick('strikeouts'),
      home_runs_allowed: pick('home_runs_allowed'),
      hit_batsmen: pick('hit_batsmen'),
      // Un lanzador antiguo puede conservar un promedio de bateo de antes de
      // las estadísticas de pitcheo: solo se rechaza si se envía, y al
      // guardarlo se borra.
      batting_average: pitcher
        ? data.batting_average
        : pick('batting_average'),
    };

    this.validatePlayerStatistics(
      position,
      statistics,
    );

    if (data.team_id !== undefined) {
      const team = await this.prisma.team.findUnique({
        where: {
          team_id: data.team_id,
        },
      });

      if (!team) {
        throw new NotFoundException(
          `El equipo con ID ${data.team_id} no existe`,
        );
      }
    }

    try {
      const updatedPlayer = await this.prisma.$transaction(async (tx) => {
        await tx.team_member.update({
          where: {
            team_member_id: id,
          },
          data: {
            ...(data.name !== undefined && {
              name: data.name,
            }),
            ...(data.number !== undefined && {
              number: data.number,
            }),
            ...(data.years_on_team !== undefined && {
              years_on_team: data.years_on_team,
            }),
            ...(data.team_id !== undefined && {
              team_id: data.team_id,
            }),
          },
        });

        return tx.player.update({
          where: {
            team_member_id: id,
          },
          data: {
            ...(data.position !== undefined && {
              position: data.position,
            }),
            ...(data.at_bats !== undefined && {
              at_bats: data.at_bats,
            }),
            ...(data.innings_pitched !== undefined && {
              innings_pitched: data.innings_pitched,
            }),
            ...(data.hits !== undefined && {
              hits: data.hits,
            }),
            ...(data.runs_allowed !== undefined && {
              runs_allowed: data.runs_allowed,
            }),
            ...(pitcher
              ? { batting_average: null }
              : data.batting_average !== undefined && {
                  batting_average: data.batting_average,
                }),
            ...(data.hits_allowed !== undefined && {
              hits_allowed: data.hits_allowed,
            }),
            ...(data.walks_allowed !== undefined && {
              walks_allowed: data.walks_allowed,
            }),
            ...(data.strikeouts !== undefined && {
              strikeouts: data.strikeouts,
            }),
            ...(data.home_runs_allowed !== undefined && {
              home_runs_allowed: data.home_runs_allowed,
            }),
            ...(data.hit_batsmen !== undefined && {
              hit_batsmen: data.hit_batsmen,
            }),
          },
          include: {
            team_member: {
              include: {
                team: true,
              },
            },
          },
        });
      });

      this.playersEventsService.emit('player.updated', updatedPlayer);

      return updatedPlayer;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'El número indicado ya está registrado para ese equipo',
        );
      }

      throw error;
    }
  }

  async deletePlayer(id: number) {
    await this.getPlayerById(id);

    const deletedPlayer = await this.prisma.$transaction(async (tx) => {
      const player = await tx.player.delete({
        where: {
          team_member_id: id,
        },
      });

      await tx.team_member.delete({
        where: {
          team_member_id: id,
        },
      });

      return player;
    });

    this.playersEventsService.emit('player.deleted', deletedPlayer);

    return deletedPlayer;
  }
}
