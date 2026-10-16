import {
  Injectable,
  MessageEvent,
} from '@nestjs/common';
import {
  Observable,
  Subject,
} from 'rxjs';

@Injectable()
export class MatchesEventsService {
  private readonly eventsSubject =
    new Subject<MessageEvent>();

  readonly events$: Observable<MessageEvent> =
    this.eventsSubject.asObservable();

  emit(
    type:
      | 'match.created'
      | 'match.updated'
      | 'match.deleted',
    data: object,
  ) {
    this.eventsSubject.next({
      type,
      data,
    });
  }
}
