import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TEST_SEASON } from '../../test/render-as';
import { SeasonPanel } from './SeasonPanel';

const older = { ...TEST_SEASON, season_id: 1, name: 'Temporada 1', started: true, match_count: 40 };
const newer = { ...TEST_SEASON, season_id: 2, name: 'Temporada 2' };

function renderPanel(canManage: boolean, selected = newer) {
  const handlers = { onSelect: vi.fn(), onCreate: vi.fn(), onEditTeams: vi.fn() };

  render(
    <SeasonPanel
      seasons={[newer, older]}
      selectedSeason={selected}
      canManage={canManage}
      {...handlers}
    />,
  );

  return handlers;
}

function options() {
  return [...(screen.getByLabelText('Temporada que se muestra') as HTMLSelectElement).options].map(
    (option) => option.text,
  );
}

describe('SeasonPanel', () => {
  it('lista las temporadas y, al final, crear una nueva (administrador)', () => {
    const { onCreate, onSelect } = renderPanel(true);

    expect(options()).toEqual([
      'Temporada 2 · Serie Nacional de Béisbol',
      'Temporada 1 · Serie Nacional de Béisbol',
      '+ Crear nueva temporada',
    ]);

    const select = screen.getByLabelText('Temporada que se muestra');

    fireEvent.change(select, { target: { value: '__create__' } });
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();

    fireEvent.change(select, { target: { value: '1' } });
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('un Usuario solo elige temporada: no puede crearla ni editar equipos', () => {
    renderPanel(false);

    expect(options()).not.toContain('+ Crear nueva temporada');
    expect(screen.queryByRole('button', { name: 'Editar equipos inscritos' })).toBeNull();
  });

  it('en una temporada empezada los equipos inscritos quedan bloqueados', () => {
    renderPanel(true, older);

    expect(
      (screen.getByRole('button', { name: 'Editar equipos inscritos' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(screen.getByText('Ya empezó: sus equipos inscritos no cambian.')).toBeTruthy();
    expect(screen.getByText('En juego')).toBeTruthy();
  });
});
