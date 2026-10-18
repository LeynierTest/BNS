import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ParseDateOnlyPipe } from '../common/pipes/parse-date-only.pipe';
import { MatchesByDateService } from './matches-by-date.service';

@Controller('matches')
export class MatchesByDateController {
  constructor(
    private readonly matchesByDateService: MatchesByDateService,
  ) {}

  @Get('by-date/:date')
  async getMatchesByDate(
    @Param('date', new ParseDateOnlyPipe()) date: string,
    @Query('stadiumId', new ParseIntPipe({ optional: true }))
    stadiumId?: number,
  ) {
    return this.matchesByDateService.getMatchesByDate(date, stadiumId);
  }
}