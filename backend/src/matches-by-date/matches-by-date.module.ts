import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MatchesByDateController } from './matches-by-date.controller';
import { MatchesByDateService } from './matches-by-date.service';

@Module({
  imports: [PrismaModule],
  controllers: [MatchesByDateController],
  providers: [MatchesByDateService],
  exports: [MatchesByDateService],
})
export class MatchesByDateModule {}