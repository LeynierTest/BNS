import {
  Injectable,
  MessageEvent,
} from '@nestjs/common';
import {
  Observable,
  Subject,
} from 'rxjs';

type TeamsEventType =
  | 'team.created'
  | 'team.updated'
  | 'team.deleted';

@Injectable()
export class TeamsEventsService {
  private readonly eventsSubject =
    new Subject<MessageEvent>();

  readonly events$: Observable<MessageEvent> =
    this.eventsSubject.asObservable();

  emit(
    type: TeamsEventType,
    data: object,
  ) {
    this.eventsSubject.next({
      type,
      data,
    });
  }
}
