import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { resolveSeasonId } from '../seasons/season-scope';

type Standing = {
  team_id: number;
  team_name: string;
  games_played: number;
  points: number;
};

@Injectable()
export class StandingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Tabla de una temporada (por defecto, la más reciente). */
  async getStandings(seasonId?: number): Promise<Standing[]> {
    const season = await resolveSeasonId(this.prisma, seasonId);
    const standings = await this.prisma.$queryRaw<
      {
        team_id: bigint;
        team_name: string;
        games_played: bigint;
        points: bigint;
      }[]
    >`
      SELECT * FROM get_standings(${season})
    `;

    return standings.map((standing) => ({
      team_id: Number(standing.team_id),
      team_name: standing.team_name,
      games_played: Number(standing.games_played),
      points: Number(standing.points),
    }));
  }
}