import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderAs } from '../test/render-as';
import { TeamsPage } from './TeamsPage';

const api = vi.hoisted(() => ({
  getTeams: vi.fn(),
  searchTeams: vi.fn(),
  createTeam: vi.fn(),
  updateTeam: vi.fn(),
  deleteTeam: vi.fn(),
}));

vi.mock('../api/teams', () => api);
vi.mock('../api/teams-events', () => ({
  connectTeamsEvents: () => () => {},
}));

describe('TeamsPage · limpiar filtros', () => {
  beforeEach(() => {
    api.getTeams.mockResolvedValue([]);
    api.searchTeams.mockResolvedValue([]);
  });

  it('vuelve a la lista completa, sin quedar como búsqueda', async () => {
    renderAs('User', <TeamsPage />);
    expect(await screen.findByText('No hay equipos registrados.')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'Industriales' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(
      await screen.findByText('No encontramos equipos con esa búsqueda.'),
    ).toBeTruthy();

    api.getTeams.mockClear();
    fireEvent.click(
      screen.getByRole('button', { name: 'Limpiar filtros' }),
    );

    expect(await screen.findByText('No hay equipos registrados.')).toBeTruthy();
    await waitFor(() => {
      expect(api.getTeams).toHaveBeenCalledTimes(1);
    });
    expect(
      screen.queryByText('No encontramos equipos con esa búsqueda.'),
    ).toBeNull();
  });
});
