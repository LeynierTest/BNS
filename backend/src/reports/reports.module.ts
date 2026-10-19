import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StandingsModule } from '../standings/standings.module';
import { MatchesByTeamsModule } from '../matches-by-teams/matches-by-teams.module';
import { MatchesByDateModule } from '../matches-by-date/matches-by-date.module';
import { TopCoachesModule } from '../top-coaches/top-coaches.module';
import { StadiumAttendanceModule } from '../stadium-attendance/stadium-attendance.module';
import { TeamStatusModule } from '../team-status/team-status.module';
import { AllStarTeamModule } from '../all-star-team/all-star-team.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    PrismaModule,
    StandingsModule,
    MatchesByTeamsModule,
    MatchesByDateModule,
    TopCoachesModule,
    StadiumAttendanceModule,
    TeamStatusModule,
    AllStarTeamModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
