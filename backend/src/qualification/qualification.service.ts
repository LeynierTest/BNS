import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { resolveSeasonId } from '../seasons/season-scope';
import {
  computeSeriesQualification,
  describeViolation,
  findIntroducedViolation,
} from './series-qualification';
import type {
  PhaseQualification,
  SeriesSnapshot,
} from './series-qualification';

/**
 * Clave de `pg_advisory_xact_lock` que serializa las escrituras que pueden
 * alterar la regla 8/4/2 (partidos, fases y equipos), para que dos cambios
 * concurrentes no se validen cada uno contra un estado que el otro invalida.
 */
const SERIES_WRITE_LOCK = 842;

export interface ConsistentWrite<T> {
  /** Temporada cuya regla 8/4/2 debe seguir cumpliéndose. */
  seasonId: number;
  /** Validaciones propias de la operación, ya con el bloqueo tomado. */
  validate?: (tx: Prisma.TransactionClient) => Promise<void>;
  /** Cómo queda la Serie si la operación se aplica. */
  simulate: (snapshot: SeriesSnapshot) => SeriesSnapshot;
  write: (tx: Prisma.TransactionClient) => Promise<T>;
  /** Partido que se está escribiendo (UNSAVED_ID en un alta). */
  focusMatchId?: number;
}

@Injectable()
export class QualificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getPhaseQualification(
    seasonId?: number,
  ): Promise<PhaseQualification[]> {
    return computeSeriesQualification(
      await this.loadSnapshot(
        this.prisma,
        await resolveSeasonId(this.prisma, seasonId),
      ),
    ).phases;
  }

  /**
   * Transacción con el bloqueo de escrituras de la Serie, para cambios que
   * no alteran la regla 8/4/2 pero deben verse serializados con los que sí
   * (p. ej. inscribir equipos solo mientras la temporada no ha empezado).
   */
  async runLocked<T>(
    write: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${SERIES_WRITE_LOCK}::bigint)`;

      return write(tx);
    });
  }

  /**
   * Ejecuta `write` en una transacción solo si la Serie sigue cumpliendo la
   * regla 8/4/2 después del cambio; si no, responde 400 con el motivo.
   */
  async runConsistentWrite<T>({
    seasonId,
    validate,
    simulate,
    write,
    focusMatchId,
  }: ConsistentWrite<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${SERIES_WRITE_LOCK}::bigint)`;
      await validate?.(tx);

      const snapshot = await this.loadSnapshot(tx, seasonId);
      const violation = findIntroducedViolation(
        snapshot,
        simulate(snapshot),
        focusMatchId,
      );

      if (violation) {
        throw new BadRequestException(
          describeViolation(violation, focusMatchId),
        );
      }

      return write(tx);
    });
  }

  /**
   * La Serie de una temporada: sus equipos inscritos (los que juegan la
   * Primera Ronda), sus fases y los partidos de esas fases.
   */
  private async loadSnapshot(
    client: Prisma.TransactionClient,
    seasonId: number,
  ): Promise<SeriesSnapshot> {
    const [teams, teamNames, phases, matches] = await Promise.all([
      client.team.findMany({
        where: { season_team: { some: { season_id: seasonId } } },
        select: { team_id: true, name: true },
      }),
      client.team.findMany({
        select: { team_id: true, name: true },
      }),
      client.phase.findMany({
        where: { season_id: seasonId },
        select: { phase_id: true, name: true },
      }),
      client.match.findMany({
        where: { phase: { season_id: seasonId } },
        select: {
          match_id: true,
          phase_id: true,
          away_team_id: true,
          home_team_id: true,
          away_score: true,
          home_score: true,
          tiebreaker: true,
          match_date: true,
        },
      }),
    ]);

    return {
      teams,
      teamNames,
      phases,
      matches: matches.map((match) => ({
        ...match,
        match_date: match.match_date.toISOString().slice(0, 10),
      })),
    };
  }
}
