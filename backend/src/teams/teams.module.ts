import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { TeamsEventsService } from './teams-events.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TeamsController],
  providers: [
    TeamsService,
    TeamsEventsService,
  ],
  exports: [TeamsEventsService],
})
export class TeamsModule {}
