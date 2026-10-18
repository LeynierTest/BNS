import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type {
  ConsistentWrite,
  QualificationService,
} from '../qualification/qualification.service';
import { UNSAVED_ID } from '../qualification/series-qualification';
import type { SeriesSnapshot } from '../qualification/series-qualification';
import type { MatchesEventsService } from './matches-events.service';
import { MatchesService } from './matches.service';
import type { CreateMatchDto } from './dto/create-match.dto';

const phase = {
  phase_id: 1,
  name: 'Primera Ronda',
  start_date: new Date('2026-10-01T00:00:00.000Z'),
  end_date: new Date('2026-10-31T00:00:00.000Z'),
};

const stadiums = [
  {
    stadium_id: 1,
    name: 'Latinoamericano',
    capacity: 50000,
    province: 'La Habana',
  },
  {
    stadium_id: 2,
    name: 'Estadio pequeño',
    capacity: 1000,
    province: 'Matanzas',
  },
];

const teams = [
  { team_id: 1, name: 'Industriales' },
  { team_id: 2, name: 'Santiago de Cuba' },
];

const validMatch = {
  away_team_id: 1,
  home_team_id: 2,
  match_date: '2026-10-17',
  stadium_id: 1,
  phase_id: 1,
  away_score: 3,
  home_score: 5,
  attendance: 30000,
} satisfies CreateMatchDto;

function createPrismaMock() {
  return {
    team: {
      findUnique: jest.fn(
        ({ where }: { where: { team_id: number } }) =>
          Promise.resolve(
            teams.find((team) => team.team_id === where.team_id) ??
              null,
          ),
      ),
    },
    stadium: {
      findUnique: jest.fn(
        ({ where }: { where: { stadium_id: number } }) =>
          Promise.resolve(
            stadiums.find(
              (stadium) => stadium.stadium_id === where.stadium_id,
            ) ?? null,
          ),
      ),
    },
    phase: {
      findUnique: jest.fn().mockResolvedValue(phase),
    },
    match: {
      create: jest.fn(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ match_id: 10, ...data }),
      ),
      findUnique: jest.fn(),
      update: jest.fn(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ match_id: 10, ...data }),
      ),
    },
  };
}

describe('MatchesService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let events: { emit: jest.Mock };
  let qualification: { runConsistentWrite: jest.Mock };
  let service: MatchesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    events = { emit: jest.fn() };
    // La regla 8/4/2 se prueba en series-qualification.spec.ts y en e2e;
    // aquí solo se ejecuta la escritura que el servicio le entrega.
    qualification = {
      runConsistentWrite: jest.fn(({ write }: ConsistentWrite<unknown>) =>
        write(prisma as never),
      ),
    };
    service = new MatchesService(
      prisma as unknown as PrismaService,
      events as unknown as MatchesEventsService,
      qualification as unknown as QualificationService,
    );
  });

  function simulatedMatches() {
    const [{ simulate }] = qualification.runConsistentWrite.mock
      .calls[0] as [ConsistentWrite<unknown>];
    const empty: SeriesSnapshot = { teams: [], phases: [], matches: [] };

    return simulate(empty).matches;
  }

  describe('createMatch', () => {
    it('crea el partido y emite el evento cuando cumple las reglas', async () => {
      await service.createMatch(validMatch);

      expect(prisma.match.create).toHaveBeenCalledTimes(1);
      expect(events.emit).toHaveBeenCalledWith(
        'match.created',
        expect.objectContaining({ match_id: 10 }),
      );
    });

    it('valida la regla 8/4/2 con el partido nuevo antes de escribirlo', async () => {
      await service.createMatch({ ...validMatch, tiebreaker: true });

      expect(qualification.runConsistentWrite).toHaveBeenCalledWith(
        expect.objectContaining({ focusMatchId: UNSAVED_ID }),
      );
      expect(simulatedMatches()).toEqual([
        {
          match_id: UNSAVED_ID,
          phase_id: 1,
          away_team_id: 1,
          home_team_id: 2,
          away_score: 3,
          home_score: 5,
          tiebreaker: true,
          match_date: '2026-10-17',
        },
      ]);
      expect(prisma.match.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tiebreaker: true }),
        }),
      );
    });

    it('no escribe nada si la regla 8/4/2 rechaza el partido', async () => {
      qualification.runConsistentWrite.mockRejectedValue(
        new BadRequestException('Industriales no está activo en Play Off'),
      );

      await expect(service.createMatch(validMatch)).rejects.toThrow(
        'Industriales no está activo en Play Off',
      );
      expect(prisma.match.create).not.toHaveBeenCalled();
      expect(events.emit).not.toHaveBeenCalled();
    });

    it('rechaza que visitante y local sean el mismo equipo', async () => {
      await expect(
        service.createMatch({ ...validMatch, home_team_id: 1 }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.match.create).not.toHaveBeenCalled();
    });

    it('responde 404 si el equipo visitante no existe', async () => {
      await expect(
        service.createMatch({ ...validMatch, away_team_id: 99 }),
      ).rejects.toThrow(NotFoundException);
    });

    it.each(['2026-10-01', '2026-10-31'])(
      'acepta las fechas límite de la fase (%s)',
      async (matchDate) => {
        await service.createMatch({
          ...validMatch,
          match_date: matchDate,
        });

        expect(prisma.match.create).toHaveBeenCalledTimes(1);
      },
    );

    it.each(['2026-09-30', '2026-11-01'])(
      'rechaza una fecha fuera del rango de la fase (%s)',
      async (matchDate) => {
        await expect(
          service.createMatch({ ...validMatch, match_date: matchDate }),
        ).rejects.toThrow(
          `La fecha del partido ${matchDate} está fuera del período de la fase "Primera Ronda" (2026-10-01 al 2026-10-31)`,
        );
        expect(prisma.match.create).not.toHaveBeenCalled();
      },
    );

    it('acepta una audiencia igual a la capacidad del estadio', async () => {
      await service.createMatch({ ...validMatch, attendance: 50000 });

      expect(prisma.match.create).toHaveBeenCalledTimes(1);
    });

    it('rechaza una audiencia mayor que la capacidad del estadio', async () => {
      await expect(
        service.createMatch({ ...validMatch, attendance: 50001 }),
      ).rejects.toThrow(
        'La audiencia (50001) no puede superar la capacidad del estadio "Latinoamericano" (50000)',
      );
      expect(prisma.match.create).not.toHaveBeenCalled();
    });
  });

  describe('updateMatch', () => {
    beforeEach(() => {
      prisma.match.findUnique.mockResolvedValue({
        match_id: 10,
        away_team_id: 1,
        home_team_id: 2,
        match_date: new Date('2026-10-17T00:00:00.000Z'),
        stadium_id: 1,
        phase_id: 1,
        away_score: 3,
        home_score: 5,
        attendance: 30000,
        tiebreaker: false,
      });
    });

    it('valida la audiencia actual contra la capacidad del nuevo estadio', async () => {
      await expect(
        service.updateMatch(10, { stadium_id: 2 }),
      ).rejects.toThrow(
        'La audiencia (30000) no puede superar la capacidad del estadio "Estadio pequeño" (1000)',
      );
      expect(prisma.match.update).not.toHaveBeenCalled();
    });

    it('valida la nueva fecha contra la fase del partido', async () => {
      await expect(
        service.updateMatch(10, { match_date: '2026-12-01' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.match.update).not.toHaveBeenCalled();
    });

    it('actualiza el resultado sin tocar los demás campos', async () => {
      await service.updateMatch(10, { home_score: 7 });

      expect(prisma.match.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { match_id: 10 },
          data: { home_score: 7 },
        }),
      );
      expect(events.emit).toHaveBeenCalledWith(
        'match.updated',
        expect.anything(),
      );
    });

    it('valida la regla 8/4/2 con el partido ya editado', async () => {
      await service.updateMatch(10, { home_score: 7 });

      expect(qualification.runConsistentWrite).toHaveBeenCalledWith(
        expect.objectContaining({ focusMatchId: 10 }),
      );
      // El partido no está en la Serie vacía simulada: se reemplaza, no se añade.
      expect(simulatedMatches()).toEqual([]);

      const [{ simulate }] = qualification.runConsistentWrite.mock
        .calls[0] as [ConsistentWrite<unknown>];
      const original = {
        match_id: 10,
        phase_id: 1,
        away_team_id: 1,
        home_team_id: 2,
        away_score: 3,
        home_score: 5,
        tiebreaker: false,
        match_date: '2026-10-17',
      };

      expect(
        simulate({ teams: [], phases: [], matches: [original] }).matches,
      ).toEqual([{ ...original, home_score: 7 }]);
    });
  });

  describe('deleteMatch', () => {
    it('valida la regla 8/4/2 sin el partido antes de borrarlo', async () => {
      prisma.match.findUnique.mockResolvedValue({ match_id: 10 });
      Object.assign(prisma.match, {
        delete: jest.fn().mockResolvedValue({ match_id: 10 }),
      });

      await service.deleteMatch(10);

      const [{ simulate, focusMatchId }] = qualification.runConsistentWrite
        .mock.calls[0] as [ConsistentWrite<unknown>];

      expect(focusMatchId).toBeUndefined();
      expect(
        simulate({
          teams: [],
          phases: [],
          matches: [
            {
              match_id: 10,
              phase_id: 1,
              away_team_id: 1,
              home_team_id: 2,
              away_score: 3,
              home_score: 5,
              tiebreaker: false,
              match_date: '2026-10-17',
            },
          ],
        }).matches,
      ).toEqual([]);
      expect(events.emit).toHaveBeenCalledWith('match.deleted', {
        match_id: 10,
      });
    });
  });
});
