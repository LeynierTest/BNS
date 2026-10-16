import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StadiumAttendanceController } from './stadium-attendance.controller';
import { StadiumAttendanceService } from './stadium-attendance.service';

@Module({
  imports: [PrismaModule],
  controllers: [StadiumAttendanceController],
  providers: [StadiumAttendanceService],
  exports: [StadiumAttendanceService],
})
export class StadiumAttendanceModule {}