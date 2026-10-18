import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { StandingsService } from './standings.service';

@Controller('standings')
export class StandingsController {
  constructor(private readonly standingsService: StandingsService) {}

  @Get()
  async getStandings(
    @Query('season_id', new ParseIntPipe({ optional: true }))
    seasonId?: number,
  ) {
    return this.standingsService.getStandings(seasonId);
  }
}