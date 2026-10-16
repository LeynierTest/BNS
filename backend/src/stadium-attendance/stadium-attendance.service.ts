import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type StadiumAttendance = {
  stadium_name: string;
  capacity: number;
  games_played: number;
  total_attendance: number;
  attendance_percentage: number | null;
};

@Injectable()
export class StadiumAttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getStadiumAttendance(): Promise<StadiumAttendance[]> {
    const stadiums = await this.prisma.$queryRaw<
      {
        stadium_name: string;
        capacity: number;
        games_played: bigint;
        total_attendance: bigint;
        attendance_percentage: number | null;
      }[]
    >`
      SELECT * FROM get_stadium_attendance()
    `;

    return stadiums.map((stadium) => ({
      stadium_name: stadium.stadium_name,
      capacity: stadium.capacity,
      games_played: Number(stadium.games_played),
      total_attendance: Number(stadium.total_attendance),
      attendance_percentage:
        stadium.attendance_percentage === null
          ? null
          : Number(stadium.attendance_percentage),
    }));
  }
}