import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
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
  ) {
    return this.matchesByTeamsService.getMatchesByTeams(
      homeTeamId,
      awayTeamId,
    );
  }
}