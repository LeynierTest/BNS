import {
  Injectable,
  MessageEvent,
} from '@nestjs/common';
import {
  Observable,
  Subject,
} from 'rxjs';

type PlayersEventType =
  | 'player.created'
  | 'player.updated'
  | 'player.deleted';

@Injectable()
export class PlayersEventsService {
  private readonly eventsSubject =
    new Subject<MessageEvent>();

  readonly events$: Observable<MessageEvent> =
    this.eventsSubject.asObservable();

  emit(
    type: PlayersEventType,
    data: object,
  ) {
    this.eventsSubject.next({
      type,
      data,
    });
  }
}
