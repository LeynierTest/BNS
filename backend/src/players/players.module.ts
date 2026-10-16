import { Module } from '@nestjs/common';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { PlayersEventsService } from './players-events.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PlayersController],
  providers: [
    PlayersService,
    PlayersEventsService,
  ],
  exports: [PlayersEventsService],
})
export class PlayersModule {}
