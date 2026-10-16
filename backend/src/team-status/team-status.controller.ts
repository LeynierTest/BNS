import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
  ) {
    return this.teamStatusService.getTeamStatus(teamId);
  }
}