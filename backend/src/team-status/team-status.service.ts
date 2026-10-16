import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type TeamStatus = {
  phase_name: string;
  games_won_total: number;
  games_lost_total: number;
  games_won_away: number;
  games_lost_away: number;
  games_won_home: number;
  games_lost_home: number;
};

@Injectable()
export class TeamStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async getTeamStatus(teamId: number): Promise<TeamStatus[]> {
    const team = await this.prisma.team.findUnique({
      where: {
        team_id: teamId,
      },
      select: {
        team_id: true,
      },
    });

    if (!team) {
      throw new NotFoundException(
        `El equipo con ID ${teamId} no existe`,
      );
    }

    const status = await this.prisma.$queryRaw<
      {
        phase_name: string;
        games_won_total: bigint;
        games_lost_total: bigint;
        games_won_away: bigint;
        games_lost_away: bigint;
        games_won_home: bigint;
        games_lost_home: bigint;
      }[]
    >`
      SELECT * FROM get_team_status(${teamId})
    `;

    return status.map((item) => ({
      phase_name: item.phase_name,
      games_won_total: Number(item.games_won_total),
      games_lost_total: Number(item.games_lost_total),
      games_won_away: Number(item.games_won_away),
      games_lost_away: Number(item.games_lost_away),
      games_won_home: Number(item.games_won_home),
      games_lost_home: Number(item.games_lost_home),
    }));
  }
}
