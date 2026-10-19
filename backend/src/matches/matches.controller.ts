import {
  Body,
  Controller,
  Delete,
  Get,
  MessageEvent,
  Sse,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Post,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { ParseDateOnlyPipe } from '../common/pipes/parse-date-only.pipe';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchesEventsService } from './matches-events.service';
import { Observable } from 'rxjs';

@Controller('matches')
export class MatchesController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly matchesEventsService: MatchesEventsService,
  ) {}

  @Sse('events')
  events(): Observable<MessageEvent> {
    return this.matchesEventsService.events$;
  }

  @Get()
  async getAllMatches(
    @Query('season_id', new ParseIntPipe({ optional: true }))
    seasonId?: number,
  ) {
    return this.matchesService.getAllMatches(seasonId);
  }

  @Get('search')
  async search(
    @Query('away_team') awayTeam?: string,
    @Query('home_team') homeTeam?: string,
    @Query('match_date', new ParseDateOnlyPipe({ optional: true }))
    matchDate?: string,
    @Query('stadium') stadium?: string,
    @Query('phase') phase?: string,
    @Query('season_id', new ParseIntPipe({ optional: true }))
    seasonId?: number,
  ) {
    return this.matchesService.searchMatches(
      awayTeam,
      homeTeam,
      matchDate,
      stadium,
      phase,
      seasonId,
    );
  }

  @Get(':id')
  async getMatchById(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.matchesService.getMatchById(id);
  }

  @Roles('Administrator')
  @Post()
  async createMatch(@Body() data: CreateMatchDto) {
    return this.matchesService.createMatch(data);
  }

  @Roles('Administrator')
  @Patch(':id')
  async updateMatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateMatchDto,
  ) {
    return this.matchesService.updateMatch(id, data);
  }

  @Roles('Administrator')
  @Delete(':id')
  async deleteMatch(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.matchesService.deleteMatch(id);
  }
}
