import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type { CreatePlayerDto } from './dto/create-player.dto';
import { isPitcherPosition } from './player-positions';
import type { PlayersEventsService } from './players-events.service';
import { PlayersService } from './players.service';

const batter = {
  name: 'Alfredo Despaigne',
  number: 54,
  years_on_team: 10,
  team_id: 1,
  position: 'Jardinero',
  at_bats: 400,
  hits: 130,
  innings_pitched: null,
  runs_allowed: null,
} satisfies CreatePlayerDto;

const pitcher = {
  ...batter,
  name: 'Norge Luis Ruiz',
  number: 21,
  position: 'Lanzador',
  at_bats: null,
  hits: null,
  innings_pitched: 120.1,
  runs_allowed: 30,
  hits_allowed: 100,
  walks_allowed: 25,
  strikeouts: 110,
  home_runs_allowed: 8,
  hit_batsmen: 4,
} satisfies CreatePlayerDto;

/** Lanzador guardado antes de las estadísticas de pitcheo (sin los 5 campos). */
const legacyPitcher = {
  team_member_id: 7,
  position: 'Lanzador',
  at_bats: null,
  hits: null,
  innings_pitched: 90.2,
  runs_allowed: 25,
  batting_average: 0.15,
  hits_allowed: null,
  walks_allowed: null,
  strikeouts: null,
  home_runs_allowed: null,
  hit_batsmen: null,
  team_member: { team_id: 1 },
};

function createService() {
  const prisma = {
    team: {
      findUnique: jest.fn().mockResolvedValue({ team_id: 1 }),
    },
    player: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn().mockResolvedValue({ team_member_id: 7 }),
  };

  const service = new PlayersService(
    prisma as unknown as PrismaService,
    { emit: jest.fn() } as unknown as PlayersEventsService,
  );

  return { prisma, service };
}

describe('isPitcherPosition', () => {
  it('sigue la misma regla que el trigger (LOWER = lanzador)', () => {
    expect(isPitcherPosition('Lanzador')).toBe(true);
    expect(isPitcherPosition('LANZADOR')).toBe(true);
    expect(isPitcherPosition('Receptor')).toBe(false);
    expect(isPitcherPosition(' Lanzador')).toBe(false);
  });
});

describe('PlayersService · estadísticas según la posición', () => {
  it.each([
    ['un bateador con turnos y hits', batter],
    ['un lanzador con todas sus estadísticas', pitcher],
    ['un bateador con tantos hits como turnos', { ...batter, hits: 400 }],
  ])('acepta %s', async (_label, data) => {
    const { prisma, service } = createService();

    await service.createPlayer(data);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      'un lanzador sin entradas lanzadas',
      { ...pitcher, innings_pitched: null },
      'Los lanzadores deben tener innings_pitched',
    ],
    [
      'un lanzador sin ponches ni pelotazos',
      { ...pitcher, strikeouts: null, hit_batsmen: undefined },
      'Los lanzadores deben tener strikeouts y hit_batsmen',
    ],
    [
      'un lanzador con turnos al bate',
      { ...pitcher, at_bats: 10 },
      'Los lanzadores no pueden tener at_bats',
    ],
    [
      'un lanzador con más jonrones que hits permitidos',
      { ...pitcher, hits_allowed: 5, home_runs_allowed: 6 },
      'home_runs_allowed no puede ser mayor que hits_allowed',
    ],
    [
      'un bateador sin hits',
      { ...batter, hits: null },
      'Los jugadores que no son lanzadores deben tener hits',
    ],
    [
      'un bateador con más hits que turnos al bate',
      { ...batter, hits: 401 },
      'hits no puede ser mayor que at_bats',
    ],
    [
      'un bateador con carreras permitidas',
      { ...batter, runs_allowed: 3 },
      'Los jugadores que no son lanzadores no pueden tener runs_allowed',
    ],
    [
      'un bateador con ponches',
      { ...batter, strikeouts: 4 },
      'Los jugadores que no son lanzadores no pueden tener strikeouts',
    ],
  ])('rechaza %s', async (_label, data, message) => {
    const { prisma, service } = createService();

    await expect(service.createPlayer(data)).rejects.toThrow(message);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('al cambiar a lanzador exige las estadísticas de lanzador', async () => {
    const { prisma, service } = createService();

    prisma.player.findUnique.mockResolvedValue({
      team_member_id: 7,
      position: 'Jardinero',
      at_bats: 400,
      hits: 130,
      innings_pitched: null,
      runs_allowed: null,
      batting_average: 0.325,
      team_member: { team_id: 1 },
    });

    await expect(
      service.updatePlayer(7, { position: 'Lanzador' }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('un lanzador antiguo debe completar sus estadísticas para editarse', async () => {
    const { prisma, service } = createService();

    prisma.player.findUnique.mockResolvedValue(legacyPitcher);

    await expect(
      service.updatePlayer(7, { name: 'Renombrado' }),
    ).rejects.toThrow(
      'Los lanzadores deben tener hits_allowed, walks_allowed, strikeouts, home_runs_allowed y hit_batsmen',
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('al completarlo se acepta aunque conserve un promedio de bateo antiguo (lo borra la base)', async () => {
    const { prisma, service } = createService();
    const playerUpdate = jest.fn().mockResolvedValue({ team_member_id: 7 });

    prisma.player.findUnique.mockResolvedValue(legacyPitcher);
    prisma.$transaction.mockImplementation(
      (callback: (tx: unknown) => Promise<unknown>) =>
        callback({
          team_member: { update: jest.fn() },
          player: { update: playerUpdate },
        }),
    );

    await service.updatePlayer(7, {
      hits_allowed: 80,
      walks_allowed: 20,
      strikeouts: 85,
      home_runs_allowed: 6,
      hit_batsmen: 3,
    });

    expect(playerUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          hits_allowed: 80,
          walks_allowed: 20,
          strikeouts: 85,
          home_runs_allowed: 6,
          hit_batsmen: 3,
        },
      }),
    );
  });
});
