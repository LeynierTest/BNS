import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TeamStatusController } from './team-status.controller';
import { TeamStatusService } from './team-status.service';

@Module({
  imports: [PrismaModule],
  controllers: [TeamStatusController],
  providers: [TeamStatusService],
  exports: [TeamStatusService],
})
export class TeamStatusModule {}