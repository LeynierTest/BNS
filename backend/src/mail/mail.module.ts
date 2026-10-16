import { Module } from '@nestjs/common';
import { ReportsModule } from '../reports/reports.module';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';

@Module({
  imports: [ReportsModule],
  controllers: [MailController],
  providers: [MailService],
})
export class MailModule {}
