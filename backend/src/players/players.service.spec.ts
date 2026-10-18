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
  batting_average: 0.325,
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
  batting_average: 0.15,
} satisfies CreatePlayerDto;

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
    ['un lanzador con entradas y carreras', pitcher],
  ])('acepta %s', async (_label, data) => {
    const { prisma, service } = createService();

    await service.createPlayer(data);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      'un lanzador sin entradas lanzadas',
      { ...pitcher, innings_pitched: null },
      'Los lanzadores deben tener innings_pitched y runs_allowed',
    ],
    [
      'un lanzador con turnos al bate',
      { ...pitcher, at_bats: 10 },
      'Los lanzadores no pueden tener at_bats',
    ],
    [
      'un bateador sin hits',
      { ...batter, hits: null },
      'Los jugadores que no son lanzadores deben tener at_bats y hits',
    ],
    [
      'un bateador con carreras permitidas',
      { ...batter, runs_allowed: 3 },
      'Los jugadores que no son lanzadores no pueden tener runs_allowed',
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
});
