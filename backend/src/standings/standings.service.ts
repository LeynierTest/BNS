import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Standing = {
  team_id: number;
  team_name: string;
  games_played: number;
  points: number;
};

@Injectable()
export class StandingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStandings(): Promise<Standing[]> {
    const standings = await this.prisma.$queryRaw<
      {
        team_id: bigint;
        team_name: string;
        games_played: bigint;
        points: bigint;
      }[]
    >`
      SELECT * FROM get_standings()
    `;

    return standings.map((standing) => ({
      team_id: Number(standing.team_id),
      team_name: standing.team_name,
      games_played: Number(standing.games_played),
      points: Number(standing.points),
    }));
  }
}