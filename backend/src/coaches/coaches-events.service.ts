import {
  Injectable,
  MessageEvent,
} from '@nestjs/common';
import {
  Observable,
  Subject,
} from 'rxjs';

type CoachesEventType =
  | 'coach.created'
  | 'coach.updated'
  | 'coach.deleted';

@Injectable()
export class CoachesEventsService {
  private readonly eventsSubject =
    new Subject<MessageEvent>();

  readonly events$: Observable<MessageEvent> =
    this.eventsSubject.asObservable();

  emit(
    type: CoachesEventType,
    data: object,
  ) {
    this.eventsSubject.next({
      type,
      data,
    });
  }
}
