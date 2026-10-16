import { Module } from '@nestjs/common';
import { CoachesController } from './coaches.controller';
import { CoachesService } from './coaches.service';
import { CoachesEventsService } from './coaches-events.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CoachesController],
  providers: [
    CoachesService,
    CoachesEventsService,
  ],
  exports: [CoachesEventsService],
})
export class CoachesModule {}
