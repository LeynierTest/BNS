import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type TopCoach = {
  team_name: string;
  coach_name: string;
  jersey_number: number;
  years_experience: number;
};

@Injectable()
export class TopCoachesService {
  constructor(private readonly prisma: PrismaService) {}

  async getTopCoaches(): Promise<TopCoach[]> {
    const coaches = await this.prisma.$queryRaw<
      {
        team_name: string;
        coach_name: string;
        jersey_number: number;
        years_experience: number;
      }[]
    >`
      SELECT * FROM get_top_coaches()
    `;

    return coaches;
  }
}