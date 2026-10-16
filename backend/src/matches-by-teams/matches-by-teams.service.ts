import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type MatchByTeams = {
  match_id: number;
  match_date: Date;
  away_team: string;
  home_team: string;
  stadium: string;
  phase: string;
  away_score: number;
  home_score: number;
  attendance: number;
};

@Injectable()
export class MatchesByTeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMatchesByTeams(
    homeTeamId: number,
    awayTeamId: number,
  ): Promise<MatchByTeams[]> {
    const matches = await this.prisma.$queryRaw<
      {
        match_id: bigint;
        match_date: Date;
        away_team: string;
        home_team: string;
        stadium: string;
        phase: string;
        away_score: bigint;
        home_score: bigint;
        attendance: bigint;
      }[]
    >`
      SELECT * FROM get_matches_by_teams(
        ${homeTeamId},
        ${awayTeamId}
      )
    `;

    return matches.map((match) => ({
      match_id: Number(match.match_id),
      match_date: match.match_date,
      away_team: match.away_team,
      home_team: match.home_team,
      stadium: match.stadium,
      phase: match.phase,
      away_score: Number(match.away_score),
      home_score: Number(match.home_score),
      attendance: Number(match.attendance),
    }));
  }
}