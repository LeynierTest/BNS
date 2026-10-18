import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QualificationModule } from '../qualification/qualification.module';
import { SeasonsController } from './seasons.controller';
import { SeasonsService } from './seasons.service';

@Module({
  imports: [PrismaModule, QualificationModule],
  controllers: [SeasonsController],
  providers: [SeasonsService],
})
export class SeasonsModule {}
