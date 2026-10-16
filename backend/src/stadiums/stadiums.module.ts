import { Module } from '@nestjs/common';
import { StadiumsController } from './stadiums.controller';
import { StadiumsService } from './stadiums.service';
import { StadiumsEventsService } from './stadiums-events.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StadiumsController],
  providers: [
    StadiumsService,
    StadiumsEventsService,
  ],
  exports: [StadiumsEventsService],
})
export class StadiumsModule {}
