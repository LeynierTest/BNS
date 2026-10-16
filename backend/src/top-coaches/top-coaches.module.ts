import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TopCoachesController } from './top-coaches.controller';
import { TopCoachesService } from './top-coaches.service';

@Module({
  imports: [PrismaModule],
  controllers: [TopCoachesController],
  providers: [TopCoachesService],
  exports: [TopCoachesService],
})
export class TopCoachesModule {}