import { StadiumsEventsService } from './stadiums-events.service';
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
import { StadiumsService } from './stadiums.service';
import { CreateStadiumDto } from './dto/create-stadium.dto';
import { UpdateStadiumDto } from './dto/update-stadium.dto';

@Controller('stadiums')
export class StadiumsController {
  constructor(
    private readonly stadiumsService: StadiumsService,
    private readonly stadiumsEventsService: StadiumsEventsService,
  ) {}

  @Get()
  async getAllStadiums() {
    return this.stadiumsService.getAllStadiums();
  }

  @Get('search')
  async search(
    @Query('name') name?: string,
    @Query('province') province?: string,
    @Query('capacity') capacity?: string,
  ) {
    return this.stadiumsService.searchStadiums(
      name,
      province,
      capacity !== undefined ? Number(capacity) : undefined,
    );
  }
  @Sse('events')
  events(): Observable<MessageEvent> {
    return this.stadiumsEventsService.events$;
  }


  @Get(':id')
  async getStadiumById(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.stadiumsService.getStadiumById(id);
  }

  @Roles('Administrator')
  @Post()
  async createStadium(
    @Body() data: CreateStadiumDto,
  ) {
    return this.stadiumsService.createStadium(data);
  }

  @Roles('Administrator')
  @Patch(':id')
  async updateStadium(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateStadiumDto,
  ) {
    return this.stadiumsService.updateStadium(id, data);
  }

  @Roles('Administrator')
  @Delete(':id')
  async deleteStadium(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.stadiumsService.deleteStadium(id);
  }
}
