import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { MatchesByTeamsService } from './matches-by-teams.service';

@Controller('matches')
export class MatchesByTeamsController {
  constructor(
    private readonly matchesByTeamsService: MatchesByTeamsService,
  ) {}

  @Get('by-teams/:homeTeamId/:awayTeamId')
  async getMatchesByTeams(
    @Param('homeTeamId', ParseIntPipe) homeTeamId: number,
    @Param('awayTeamId', ParseIntPipe) awayTeamId: number,
    @Query('season_id', new ParseIntPipe({ optional: true }))
    seasonId?: number,
  ) {
    return this.matchesByTeamsService.getMatchesByTeams(
      homeTeamId,
      awayTeamId,
      seasonId,
    );
  }
}