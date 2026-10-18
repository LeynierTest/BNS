import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { StadiumAttendanceService } from './stadium-attendance.service';

@Controller('stadiums')
export class StadiumAttendanceController {
  constructor(
    private readonly stadiumAttendanceService: StadiumAttendanceService,
  ) {}

  @Get('attendance')
  async getStadiumAttendance(
    @Query('season_id', new ParseIntPipe({ optional: true }))
    seasonId?: number,
  ) {
    return this.stadiumAttendanceService.getStadiumAttendance(seasonId);
  }
}