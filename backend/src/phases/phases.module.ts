import { Module } from '@nestjs/common';
import { PhasesController } from './phases.controller';
import { PhasesService } from './phases.service';
import { PhasesEventsService } from './phases-events.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QualificationModule } from '../qualification/qualification.module';

@Module({
  imports: [PrismaModule, QualificationModule],
  controllers: [PhasesController],
  providers: [
    PhasesService,
    PhasesEventsService,
  ],
  exports: [PhasesEventsService],
})
export class PhasesModule {}
