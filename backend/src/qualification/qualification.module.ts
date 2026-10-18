import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QualificationController } from './qualification.controller';
import { QualificationService } from './qualification.service';

@Module({
  imports: [PrismaModule],
  controllers: [QualificationController],
  providers: [QualificationService],
  exports: [QualificationService],
})
export class QualificationModule {}
