import { Controller, Get } from '@nestjs/common';
import { TopCoachesService } from './top-coaches.service';

@Controller('coaches')
export class TopCoachesController {
  constructor(
    private readonly topCoachesService: TopCoachesService,
  ) {}

  @Get('top')
  async getTopCoaches() {
    return this.topCoachesService.getTopCoaches();
  }
}