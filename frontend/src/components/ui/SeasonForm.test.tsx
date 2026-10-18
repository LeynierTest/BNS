import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SeasonForm } from './SeasonForm';

const team = (team_id: number, name: string) => ({
  team_id,
  name,
  province: 'P',
  championships_participated: 1,
  championships_won: 0,
  mascot: 'M',
  color: 'C',
});
const teams = [team(1, 'Industriales'), team(2, 'Santiago de Cuba'), team(3, 'Pinar del Río')];
const series = [{ series_id: 1, name: 'Serie Nacional de Béisbol' }];

function renderForm() {
  const onSubmit = vi.fn();

  render(
    <SeasonForm series={series} teams={teams} defaultSeriesId={1} onSubmit={onSubmit} onCancel={() => {}} />,
  );

  return onSubmit;
}

function create() {
  fireEvent.click(screen.getByRole('button', { name: 'Crear temporada' }));
}

describe('SeasonForm', () => {
  it('crea la temporada en la Serie elegida con todos los equipos por defecto', () => {
    const onSubmit = renderForm();

    fireEvent.change(screen.getByLabelText('Nombre de la temporada'), {
      target: { value: ' Temporada 2027 ' },
    });
    create();

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Temporada 2027',
      series_id: 1,
      team_ids: [1, 2, 3],
    });
  });

  it('puede crear una Serie nueva y dejar fuera equipos', () => {
    const onSubmit = renderForm();

    fireEvent.change(screen.getByLabelText('Serie'), { target: { value: '__new__' } });
    fireEvent.change(screen.getByLabelText('Nombre de la Serie'), {
      target: { value: 'Liga Élite' },
    });
    fireEvent.change(screen.getByLabelText('Nombre de la temporada'), {
      target: { value: '2027' },
    });
    fireEvent.click(screen.getByLabelText('Pinar del Río'));
    create();

    expect(onSubmit).toHaveBeenCalledWith({
      name: '2027',
      series_name: 'Liga Élite',
      team_ids: [1, 2],
    });
  });

  it('valida nombre, Serie nueva y al menos 2 equipos antes de enviar', () => {
    const onSubmit = renderForm();

    fireEvent.change(screen.getByLabelText('Serie'), { target: { value: '__new__' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ninguno' }));
    create();

    expect(screen.getByText('El nombre de la temporada es obligatorio.')).toBeTruthy();
    expect(screen.getByText('El nombre de la Serie es obligatorio.')).toBeTruthy();
    expect(screen.getByText('Una temporada necesita al menos 2 equipos.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
