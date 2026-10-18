import { CoachesEventsService } from './coaches-events.service';
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
import { CoachesService } from './coaches.service';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';

@Controller('coaches')
export class CoachesController {
  constructor(
    private readonly coachesService: CoachesService,
    private readonly coachesEventsService: CoachesEventsService,
  ) {}

  @Get()
  async findAll() {
    return this.coachesService.getAllCoaches();
  }

  @Get('search')
  async search(
    @Query('number', new ParseIntPipe({ optional: true }))
    number?: number,
    @Query('name') name?: string,
    @Query('team') team?: string,
    @Query('years_on_team', new ParseIntPipe({ optional: true }))
    yearsOnTeam?: number,
    @Query('years_experience', new ParseIntPipe({ optional: true }))
    yearsExperience?: number,
  ) {
    return this.coachesService.searchCoaches(
      number,
      name,
      team,
      yearsOnTeam,
      yearsExperience,
    );
  }
  @Sse('events')
  events(): Observable<MessageEvent> {
    return this.coachesEventsService.events$;
  }


  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.coachesService.getCoachById(id);
  }

  @Roles('Administrator')
  @Post()
  async create(@Body() data: CreateCoachDto) {
    return this.coachesService.createCoach(data);
  }

  @Roles('Administrator')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCoachDto,
  ) {
    return this.coachesService.updateCoach(id, data);
  }

  @Roles('Administrator')
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.coachesService.deleteCoach(id);
  }
}
