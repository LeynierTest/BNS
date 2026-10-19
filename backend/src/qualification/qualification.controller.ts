import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { QualificationService } from './qualification.service';

@Controller('qualification')
export class QualificationController {
  constructor(
    private readonly qualificationService: QualificationService,
  ) {}

  /**
   * Equipos activos, tabla y corte de cada fase de una temporada (regla
   * 8/4/2); sin season_id, la temporada más reciente.
   */
  @Get()
  async getPhaseQualification(
    @Query('season_id', new ParseIntPipe({ optional: true }))
    seasonId?: number,
  ) {
    return this.qualificationService.getPhaseQualification(seasonId);
  }
}
