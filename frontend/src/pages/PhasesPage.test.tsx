import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderAs } from '../test/render-as';
import PhasesPage from './PhasesPage';

const api = vi.hoisted(() => ({
  getPhases: vi.fn(),
  searchPhases: vi.fn(),
  createPhase: vi.fn(),
  updatePhase: vi.fn(),
  deletePhase: vi.fn(),
}));
const phaseEvents = vi.hoisted(() => [] as (() => void)[]);

vi.mock('../api/phases', () => api);
vi.mock('../api/phases-events', () => ({
  connectPhasesEvents: ({ onEvent }: { onEvent: () => void }) => {
    phaseEvents.push(onEvent);
    return () => {};
  },
}));
vi.mock('../api/matches-events', () => ({
  connectMatchesEvents: () => () => {},
}));
vi.mock('../api/teams-events', () => ({
  connectTeamsEvents: () => () => {},
}));
vi.mock('../api/qualification', () => ({
  getPhaseQualification: vi.fn().mockResolvedValue([]),
}));

const primera = {
  phase_id: 1,
  name: 'Primera Ronda',
  start_date: '2026-01-01',
  end_date: '2026-01-31',
};
const segunda = {
  phase_id: 2,
  name: 'Segunda Ronda',
  start_date: '2026-02-01',
  end_date: '2026-02-28',
};
const playOff = {
  phase_id: 3,
  name: 'Play Off',
  start_date: '2026-03-01',
  end_date: '2026-03-15',
};

describe('PhasesPage · búsqueda y recargas', () => {
  beforeEach(() => {
    phaseEvents.length = 0;
    api.getPhases.mockResolvedValue([primera, segunda]);
    api.searchPhases.mockResolvedValue([segunda]);
  });

  async function searchByName(name: string) {
    renderAs('Administrator', <PhasesPage />);
    await screen.findByText('Primera Ronda');

    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: name },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() => {
      expect(screen.queryByText('Primera Ronda')).toBeNull();
    });
  }

  it('busca con los filtros escritos', async () => {
    await searchByName('Segunda');

    expect(api.searchPhases).toHaveBeenCalledWith(
      { name: 'Segunda', active_date: undefined },
      1,
    );
    expect(screen.getByText('Segunda Ronda')).toBeTruthy();
  });

  it('una recarga por evento repite la búsqueda en vez de mostrar todo', async () => {
    await searchByName('Segunda');
    api.searchPhases.mockClear();

    act(() => {
      phaseEvents.forEach((onEvent) => onEvent());
    });

    await waitFor(() => {
      expect(api.searchPhases).toHaveBeenCalledWith(
        { name: 'Segunda', active_date: undefined },
        1,
      );
    });
    expect(screen.queryByText('Primera Ronda')).toBeNull();
    expect(screen.getByText('Segunda Ronda')).toBeTruthy();
  });

  it('limpiar los filtros vuelve a pedir la lista completa y actualizada', async () => {
    await searchByName('Segunda');
    // Mientras tanto se creó otra fase.
    api.getPhases.mockResolvedValue([primera, segunda, playOff]);

    fireEvent.click(
      screen.getByRole('button', { name: 'Limpiar filtros' }),
    );

    expect(await screen.findByText('Play Off')).toBeTruthy();
    expect(screen.getByText('Primera Ronda')).toBeTruthy();
    expect(
      (screen.getByLabelText('Nombre') as HTMLInputElement).value,
    ).toBe('');
  });
});
