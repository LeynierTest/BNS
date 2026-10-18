import { Controller, Get } from '@nestjs/common';
import { QualificationService } from './qualification.service';

@Controller('qualification')
export class QualificationController {
  constructor(
    private readonly qualificationService: QualificationService,
  ) {}

  /** Equipos activos, tabla y corte de cada fase de la Serie (regla 8/4/2). */
  @Get()
  async getPhaseQualification() {
    return this.qualificationService.getPhaseQualification();
  }
}
