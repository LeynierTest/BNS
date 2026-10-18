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

  private validatePlayerStatistics(
    position: string,
    data: {
      at_bats?: number | null;
      hits?: number | null;
      innings_pitched?: number | Prisma.Decimal | null;
      runs_allowed?: number | null;
    },
  ) {
    if (isPitcherPosition(position)) {
      if (
        data.innings_pitched === null ||
        data.innings_pitched === undefined ||
        data.runs_allowed === null ||
        data.runs_allowed === undefined
      ) {
        throw new BadRequestException(
          'Los lanzadores deben tener innings_pitched y runs_allowed',
        );
      }

      if (
        data.at_bats !== null &&
        data.at_bats !== undefined
      ) {
        throw new BadRequestException(
          'Los lanzadores no pueden tener at_bats',
        );
      }

      if (
        data.hits !== null &&
        data.hits !== undefined
      ) {
        throw new BadRequestException(
          'Los lanzadores no pueden tener hits',
        );
      }

      return;
    }

    if (
      data.at_bats === null ||
      data.at_bats === undefined ||
      data.hits === null ||
      data.hits === undefined
    ) {
      throw new BadRequestException(
        'Los jugadores que no son lanzadores deben tener at_bats y hits',
      );
    }

    if (
      data.innings_pitched !== null &&
      data.innings_pitched !== undefined
    ) {
      throw new BadRequestException(
        'Los jugadores que no son lanzadores no pueden tener innings_pitched',
      );
    }

    if (
      data.runs_allowed !== null &&
      data.runs_allowed !== undefined
    ) {
      throw new BadRequestException(
        'Los jugadores que no son lanzadores no pueden tener runs_allowed',
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
              batting_average: data.batting_average,
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

    const statistics = {
      at_bats:
        data.at_bats !== undefined
          ? data.at_bats
          : currentPlayer.at_bats,

      hits:
        data.hits !== undefined
          ? data.hits
          : currentPlayer.hits,

      innings_pitched:
        data.innings_pitched !== undefined
          ? data.innings_pitched
          : currentPlayer.innings_pitched,

      runs_allowed:
        data.runs_allowed !== undefined
          ? data.runs_allowed
          : currentPlayer.runs_allowed,
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
            ...(data.batting_average !== undefined && {
              batting_average: data.batting_average,
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
