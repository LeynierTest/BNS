import {
  Injectable,
  MessageEvent,
} from '@nestjs/common';
import {
  Observable,
  Subject,
} from 'rxjs';

type PhasesEventType =
  | 'phase.created'
  | 'phase.updated'
  | 'phase.deleted';

@Injectable()
export class PhasesEventsService {
  private readonly eventsSubject =
    new Subject<MessageEvent>();

  readonly events$: Observable<MessageEvent> =
    this.eventsSubject.asObservable();

  emit(
    type: PhasesEventType,
    data: object,
  ) {
    this.eventsSubject.next({
      type,
      data,
    });
  }
}
