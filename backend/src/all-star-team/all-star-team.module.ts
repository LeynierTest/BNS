import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AllStarTeamController } from './all-star-team.controller';
import { AllStarTeamService } from './all-star-team.service';

@Module({
  imports: [PrismaModule],
  controllers: [AllStarTeamController],
  providers: [AllStarTeamService],
  exports: [AllStarTeamService],
})
export class AllStarTeamModule {}
