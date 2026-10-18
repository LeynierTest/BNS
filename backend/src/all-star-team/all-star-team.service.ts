import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Estadísticas del lanzador (get_pitching_stats); ERA decide la selección. */
export type PitchingStats = {
  era: number;
  /** null si al lanzador le faltan los datos (filas anteriores a estos campos). */
  whip: number | null;
  k_per_9: number | null;
  bb_per_9: number | null;
  fip: number | null;
};

export type AllStarPlayer = {
  player_position: string;
  player_name: string;
  team_name: string;
  /** Promedio de bateo; null en el lanzador, cuyo promedio es el ERA. */
  batting_average: number | null;
  pitching: PitchingStats | null;
};

type Numeric = Prisma.Decimal | string | number | null;

function toNumber(value: Numeric): number | null {
  return value === null ? null : Number(value);
}

@Injectable()
export class AllStarTeamService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllStarTeam(): Promise<AllStarPlayer[]> {
    const players = await this.prisma.$queryRaw<
      {
        player_position: string;
        player_name: string;
        team_name: string;
        batting_average: Numeric;
        era: Numeric;
        whip: Numeric;
        k_per_9: Numeric;
        bb_per_9: Numeric;
        fip: Numeric;
      }[]
    >`
      SELECT * FROM get_all_star_team()
    `;

    return players.map((player) => {
      const era = toNumber(player.era);

      return {
        player_position: player.player_position,
        player_name: player.player_name,
        team_name: player.team_name,
        batting_average: toNumber(player.batting_average),
        pitching:
          era === null
            ? null
            : {
                era,
                whip: toNumber(player.whip),
                k_per_9: toNumber(player.k_per_9),
                bb_per_9: toNumber(player.bb_per_9),
                fip: toNumber(player.fip),
              },
      };
    });
  }
}
