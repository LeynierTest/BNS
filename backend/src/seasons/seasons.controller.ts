import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonTeamsDto } from './dto/update-season-teams.dto';
import { SeasonsService } from './seasons.service';

@Controller()
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Get('series')
  async getSeries() {
    return this.seasonsService.getSeries();
  }

  @Get('seasons')
  async getSeasons() {
    return this.seasonsService.getSeasons();
  }

  @Roles('Administrator')
  @Post('seasons')
  async createSeason(@Body() data: CreateSeasonDto) {
    return this.seasonsService.createSeason(data);
  }

  @Get('seasons/:id/teams')
  async getSeasonTeams(@Param('id', ParseIntPipe) id: number) {
    return this.seasonsService.getSeasonTeams(id);
  }

  @Roles('Administrator')
  @Put('seasons/:id/teams')
  async updateSeasonTeams(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateSeasonTeamsDto,
  ) {
    return this.seasonsService.updateSeasonTeams(id, data);
  }
}
