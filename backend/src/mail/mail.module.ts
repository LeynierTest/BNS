import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportsModule } from '../reports/reports.module';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';

@Module({
  imports: [PrismaModule, ReportsModule],
  controllers: [MailController],
  providers: [MailService],
})
export class MailModule {}
