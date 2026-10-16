import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MatchesByTeamsController } from './matches-by-teams.controller';
import { MatchesByTeamsService } from './matches-by-teams.service';

@Module({
  imports: [PrismaModule],
  controllers: [MatchesByTeamsController],
  providers: [MatchesByTeamsService],
  exports: [MatchesByTeamsService],
})
export class MatchesByTeamsModule {}