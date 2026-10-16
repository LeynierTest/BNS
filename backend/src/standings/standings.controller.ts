import { Controller, Get } from '@nestjs/common';
import { StandingsService } from './standings.service';

@Controller('standings')
export class StandingsController {
  constructor(private readonly standingsService: StandingsService) {}

  @Get()
  async getStandings() {
    return this.standingsService.getStandings();
  }
}