import { Controller, Get } from '@nestjs/common';
import { AllStarTeamService } from './all-star-team.service';

@Controller('players')
export class AllStarTeamController {
  constructor(
    private readonly allStarTeamService: AllStarTeamService,
  ) {}

  @Get('all-star')
  async getAllStarTeam() {
    return this.allStarTeamService.getAllStarTeam();
  }
}
