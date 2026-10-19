import { PhasesEventsService } from './phases-events.service';
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
import { ParseDateOnlyPipe } from '../common/pipes/parse-date-only.pipe';
import { PhasesService } from './phases.service';
import { CreatePhaseDto } from './dto/create-phase.dto';
import { UpdatePhaseDto } from './dto/update-phase.dto';

@Controller('phases')
export class PhasesController {
  constructor(
    private readonly phasesService: PhasesService,
    private readonly phasesEventsService: PhasesEventsService,
  ) {}

  @Get()
  async getAllPhases(
    @Query('season_id', new ParseIntPipe({ optional: true }))
    seasonId?: number,
  ) {
    return this.phasesService.getAllPhases(seasonId);
  }

  @Get('search')
  async search(
    @Query('name') name?: string,
    @Query('active_date', new ParseDateOnlyPipe({ optional: true }))
    activeDate?: string,
    @Query('season_id', new ParseIntPipe({ optional: true }))
    seasonId?: number,
  ) {
    return this.phasesService.searchPhases(
      name,
      activeDate,
      seasonId,
    );
  }
  @Sse('events')
  events(): Observable<MessageEvent> {
    return this.phasesEventsService.events$;
  }


  @Get(':id')
  async getPhaseById(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.phasesService.getPhaseById(id);
  }

  @Roles('Administrator')
  @Post()
  async createPhase(
    @Body() data: CreatePhaseDto,
  ) {
    return this.phasesService.createPhase(data);
  }

  @Roles('Administrator')
  @Patch(':id')
  async updatePhase(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdatePhaseDto,
  ) {
    return this.phasesService.updatePhase(id, data);
  }

  @Roles('Administrator')
  @Delete(':id')
  async deletePhase(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.phasesService.deletePhase(id);
  }
}
