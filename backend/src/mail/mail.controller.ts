import { Body, Controller, Post, Req } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/guards/jwt-auth.guard';
import { MailService } from './mail.service';
import { SendReportEmailDto } from './dto/send-report-email.dto';

@Controller('reports/email')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post()
  async sendReportEmail(
    @Body() dto: SendReportEmailDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.mailService.sendReportEmail(dto, {
      userId: request.user!.sub,
      role: request.user!.role,
    });
  }
}
