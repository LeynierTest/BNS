import { Body, Controller, Post } from '@nestjs/common';
import { MailService } from './mail.service';
import { SendReportEmailDto } from './dto/send-report-email.dto';

@Controller('reports/email')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post()
  async sendReportEmail(@Body() dto: SendReportEmailDto) {
    return this.mailService.sendReportEmail(dto);
  }
}
