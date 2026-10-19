import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { TeamStatusService } from './team-status.service';

@Controller('teams')
export class TeamStatusController {
  constructor(
    private readonly teamStatusService: TeamStatusService,
  ) {}

  @Get(':teamId/status')
  async getTeamStatus(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Query('season_id', new ParseIntPipe({ optional: true }))
    seasonId?: number,
  ) {
    return this.teamStatusService.getTeamStatus(teamId, seasonId);
  }
}