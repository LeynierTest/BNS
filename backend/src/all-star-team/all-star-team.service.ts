import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type AllStarPlayer = {
  player_position: string;
  player_name: string;
  team_name: string;
  batting_average: number;
};

@Injectable()
export class AllStarTeamService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllStarTeam(): Promise<AllStarPlayer[]> {
    const players = await this.prisma.$queryRaw<
      {
        player_position: string;
        player_name: string;
        team_name: string;
        batting_average: string | number;
      }[]
    >`
      SELECT * FROM get_all_star_team()
    `;

    return players.map((player) => ({
      player_position: player.player_position,
      player_name: player.player_name,
      team_name: player.team_name,
      batting_average: Number(player.batting_average),
    }));
  }
}
