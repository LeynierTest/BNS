import {
  Injectable,
  MessageEvent,
} from '@nestjs/common';
import {
  merge,
  Observable,
} from 'rxjs';
import { TeamsEventsService } from '../teams/teams-events.service';
import { PlayersEventsService } from '../players/players-events.service';
import { CoachesEventsService } from '../coaches/coaches-events.service';
import { StadiumsEventsService } from '../stadiums/stadiums-events.service';
import { PhasesEventsService } from '../phases/phases-events.service';
import { MatchesEventsService } from '../matches/matches-events.service';

@Injectable()
export class DashboardEventsService {
  readonly events$: Observable<MessageEvent>;

  constructor(
    teamsEventsService: TeamsEventsService,
    playersEventsService: PlayersEventsService,
    coachesEventsService: CoachesEventsService,
    stadiumsEventsService: StadiumsEventsService,
    phasesEventsService: PhasesEventsService,
    matchesEventsService: MatchesEventsService,
  ) {
    this.events$ = merge(
      teamsEventsService.events$,
      playersEventsService.events$,
      coachesEventsService.events$,
      stadiumsEventsService.events$,
      phasesEventsService.events$,
      matchesEventsService.events$,
    );
  }
}
