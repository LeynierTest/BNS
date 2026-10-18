import { TeamsEventsService } from './teams-events.service';
import { Observable } from 'rxjs';
import {
  MessageEvent,
  Sse,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService,
    private readonly teamsEventsService: TeamsEventsService) {}

  @Get()
  async findAll() {
    return this.teamsService.getAllTeams();
  }

  @Get('search')
  async search(
    @Query('name') name?: string,
    @Query('province') province?: string,
    @Query('color') color?: string,
    @Query('mascot') mascot?: string,
    @Query(
      'championships_participated',
      new ParseIntPipe({ optional: true }),
    )
    championshipsParticipated?: number,
    @Query('championships_won', new ParseIntPipe({ optional: true }))
    championshipsWon?: number,
  ) {
    return this.teamsService.searchTeams(
      name,
      province,
      color,
      mascot,
      championshipsParticipated,
      championshipsWon,
    );
  }
  @Sse('events')
  events(): Observable<MessageEvent> {
    return this.teamsEventsService.events$;
  }


  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.teamsService.getTeamById(id);
  }

  @Roles('Administrator')
  @Post()
  async create(@Body() data: CreateTeamDto) {
    return this.teamsService.createTeam(data);
  }

  @Roles('Administrator')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateTeamDto,
  ) {
    return this.teamsService.updateTeam(id, data);
  }

  @Roles('Administrator')
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.teamsService.deleteTeam(id);
  }
}
