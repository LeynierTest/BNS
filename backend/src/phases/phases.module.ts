import { Module } from '@nestjs/common';
import { PhasesController } from './phases.controller';
import { PhasesService } from './phases.service';
import { PhasesEventsService } from './phases-events.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PhasesController],
  providers: [
    PhasesService,
    PhasesEventsService,
  ],
  exports: [PhasesEventsService],
})
export class PhasesModule {}
