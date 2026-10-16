import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { TeamsModule } from './teams/teams.module';
import { PlayersModule } from './players/players.module';
import { MatchesModule } from './matches/matches.module';
import { StadiumsModule } from './stadiums/stadiums.module';
import { PhasesModule } from './phases/phases.module';
import { CoachesModule } from './coaches/coaches.module';
import { StandingsModule } from './standings/standings.module';
import { MatchesByDateModule } from './matches-by-date/matches-by-date.module';
import { MatchesByTeamsModule } from './matches-by-teams/matches-by-teams.module';
import { TopCoachesModule } from './top-coaches/top-coaches.module';
import { StadiumAttendanceModule } from './stadium-attendance/stadium-attendance.module';
import { TeamStatusModule } from './team-status/team-status.module';
import { AllStarTeamModule } from './all-star-team/all-star-team.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import { MailModule } from './mail/mail.module';
import { DashboardEventsModule } from './dashboard-events/dashboard-events.module';

@Module({
  imports: [
    PrismaModule,
    TeamsModule,
    AllStarTeamModule,
    PlayersModule,
    MatchesModule,
    PhasesModule,
    TopCoachesModule,
    CoachesModule,
    StandingsModule,
    MatchesByDateModule,
    MatchesByTeamsModule,
    StadiumAttendanceModule,
    StadiumsModule,
    TeamStatusModule,
    AuthModule,
    UsersModule,
    ReportsModule,
    MailModule,
    DashboardEventsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
