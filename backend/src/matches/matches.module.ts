import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchesEventsService } from './matches-events.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MatchesController],
  providers: [
    MatchesService,
    MatchesEventsService,
  ],
  exports: [MatchesEventsService],
})
export class MatchesModule {}
