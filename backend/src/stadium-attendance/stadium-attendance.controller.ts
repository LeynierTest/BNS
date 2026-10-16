import { Controller, Get } from '@nestjs/common';
import { StadiumAttendanceService } from './stadium-attendance.service';

@Controller('stadiums')
export class StadiumAttendanceController {
  constructor(
    private readonly stadiumAttendanceService: StadiumAttendanceService,
  ) {}

  @Get('attendance')
  async getStadiumAttendance() {
    return this.stadiumAttendanceService.getStadiumAttendance();
  }
}