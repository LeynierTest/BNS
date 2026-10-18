import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchesEventsService } from './matches-events.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QualificationModule } from '../qualification/qualification.module';

@Module({
  imports: [PrismaModule, QualificationModule],
  controllers: [MatchesController],
  providers: [
    MatchesService,
    MatchesEventsService,
  ],
  exports: [MatchesEventsService],
})
export class MatchesModule {}
