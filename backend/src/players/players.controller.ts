import { PlayersEventsService } from './players-events.service';
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
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Controller('players')
export class PlayersController {
  constructor(
    private readonly playersService: PlayersService,
    private readonly playersEventsService: PlayersEventsService,
  ) {}

  @Get()
  async findAll() {
    return this.playersService.getAllPlayers();
  }

  @Get('search')
  async search(
    @Query('number', new ParseIntPipe({ optional: true }))
    number?: number,
    @Query('name') name?: string,
    @Query('team') team?: string,
    @Query('position') position?: string,
  ) {
    return this.playersService.searchPlayers(
      number,
      name,
      team,
      position,
    );
  }
  @Sse('events')
  events(): Observable<MessageEvent> {
    return this.playersEventsService.events$;
  }


  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.playersService.getPlayerById(id);
  }

  @Roles('Administrator')
  @Post()
  async create(@Body() data: CreatePlayerDto) {
    return this.playersService.createPlayer(data);
  }

  @Roles('Administrator')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdatePlayerDto,
  ) {
    return this.playersService.updatePlayer(id, data);
  }

  @Roles('Administrator')
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.playersService.deletePlayer(id);
  }
}