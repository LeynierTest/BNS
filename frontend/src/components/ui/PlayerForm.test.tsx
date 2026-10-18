import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlayerForm } from './PlayerForm';

const teams = [
  {
    team_id: 1,
    name: 'Industriales',
    province: 'La Habana',
    championships_participated: 50,
    championships_won: 12,
    mascot: 'León',
    color: 'Azul',
  },
];

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), {
    target: { value },
  });
}

function renderForm(position: string) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);

  render(
    <PlayerForm teams={teams} onSubmit={onSubmit} onCancel={() => {}} />,
  );
  fill('Nombre', 'Jugador');
  fill('Número', '10');
  fill('Años en equipo', '2');
  fill('Equipo', '1');
  fill('Posición', position);

  return onSubmit;
}

function save() {
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
}

describe('PlayerForm · bateador', () => {
  it('muestra el promedio calculado y no lo envía (lo calcula el backend)', async () => {
    const onSubmit = renderForm('Receptor');

    fill('Veces al bate', '7');
    fill('Hits', '2');

    expect(
      screen.getByText(
        'Promedio de bateo: 0.286. Se calcula solo (hits / veces al bate).',
      ),
    ).toBeTruthy();
    expect(screen.queryByLabelText('Promedio de bateo')).toBeNull();

    save();

    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const [data] = onSubmit.mock.calls[0] as [Record<string, unknown>];

    expect(data).toMatchObject({ at_bats: 7, hits: 2, innings_pitched: null });
    expect(data).not.toHaveProperty('batting_average');
  });

  it('no deja guardar más hits que veces al bate', () => {
    const onSubmit = renderForm('Receptor');

    fill('Veces al bate', '3');
    fill('Hits', '4');
    save();

    expect(
      screen.getByText('Los hits no pueden superar las veces al bate.'),
    ).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('PlayerForm · lanzador', () => {
  function fillPitching(overrides: Record<string, string> = {}) {
    const values: Record<string, string> = {
      'Entradas lanzadas': '90.2',
      'Carreras permitidas': '25',
      'Hits permitidos': '80',
      'Bases por bolas': '20',
      Ponches: '85',
      'Jonrones permitidos': '6',
      'Pelotazos (bateadores golpeados)': '3',
      ...overrides,
    };

    for (const [label, value] of Object.entries(values)) {
      fill(label, value);
    }
  }

  it('envía las siete estadísticas y ningún dato de bateo', async () => {
    const onSubmit = renderForm('Lanzador');

    fillPitching();
    save();

    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      at_bats: null,
      hits: null,
      innings_pitched: 90.2,
      runs_allowed: 25,
      hits_allowed: 80,
      walks_allowed: 20,
      strikeouts: 85,
      home_runs_allowed: 6,
      hit_batsmen: 3,
    });
  });

  it.each([
    [
      'entradas con un tercer out',
      { 'Entradas lanzadas': '90.3' },
      'Usa la notación de béisbol: entradas completas y .0, .1 o .2 (90.2 = 90 ⅔).',
    ],
    [
      'más jonrones que hits',
      { 'Hits permitidos': '5', 'Jonrones permitidos': '6' },
      'Los jonrones permitidos no pueden superar los hits permitidos.',
    ],
  ])('rechaza %s', (_label, overrides, message) => {
    const onSubmit = renderForm('Lanzador');

    fillPitching(overrides);
    save();

    expect(screen.getByText(message)).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
