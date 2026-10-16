import {
  Controller,
  Get,
  MessageEvent,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { DashboardEventsService } from './dashboard-events/dashboard-events.service';

@Controller()
export class AppController {
  constructor(
    private readonly dashboardEventsService: DashboardEventsService,
  ) {}

  @Get()
  getHello(): string {
    return 'BNSM Backend funcionando';
  }

  @Sse('dashboard/events')
  events(): Observable<MessageEvent> {
    return this.dashboardEventsService.events$;
  }
}
