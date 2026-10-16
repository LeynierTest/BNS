import {
  Injectable,
  MessageEvent,
} from '@nestjs/common';
import {
  Observable,
  Subject,
} from 'rxjs';

type StadiumsEventType =
  | 'stadium.created'
  | 'stadium.updated'
  | 'stadium.deleted';

@Injectable()
export class StadiumsEventsService {
  private readonly eventsSubject =
    new Subject<MessageEvent>();

  readonly events$: Observable<MessageEvent> =
    this.eventsSubject.asObservable();

  emit(
    type: StadiumsEventType,
    data: object,
  ) {
    this.eventsSubject.next({
      type,
      data,
    });
  }
}
