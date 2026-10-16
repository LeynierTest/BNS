import { Global, Module } from '@nestjs/common';
import { DashboardEventsService } from './dashboard-events.service';
import { TeamsModule } from '../teams/teams.module';
import { PlayersModule } from '../players/players.module';
import { CoachesModule } from '../coaches/coaches.module';
import { StadiumsModule } from '../stadiums/stadiums.module';
import { PhasesModule } from '../phases/phases.module';
import { MatchesModule } from '../matches/matches.module';

@Global()
@Module({
  imports: [
    TeamsModule,
    PlayersModule,
    CoachesModule,
    StadiumsModule,
    PhasesModule,
    MatchesModule,
  ],
  providers: [DashboardEventsService],
  exports: [DashboardEventsService],
})
export class DashboardEventsModule {}
