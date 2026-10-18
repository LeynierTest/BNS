import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderAs } from '../test/render-as';
import StadiumsPage from './StadiumsPage';

const api = vi.hoisted(() => ({
  getStadiums: vi.fn(),
  searchStadiums: vi.fn(),
  createStadium: vi.fn(),
  updateStadium: vi.fn(),
  deleteStadium: vi.fn(),
}));

vi.mock('../api/stadiums', () => api);
vi.mock('../api/stadiums-events', () => ({
  connectStadiumsEvents: () => () => {},
}));

const latino = {
  stadium_id: 1,
  name: 'Latinoamericano',
  capacity: 55000,
  province: 'La Habana',
};
const created = {
  stadium_id: 2,
  name: 'Nelson Fernández',
  capacity: 4000,
  province: 'Mayabeque',
};

describe('StadiumsPage · cambios con una búsqueda activa', () => {
  beforeEach(() => {
    api.getStadiums.mockResolvedValue([latino]);
    api.searchStadiums.mockResolvedValue([latino]);
    api.createStadium.mockResolvedValue(created);
  });

  it('tras crear un estadio repite la búsqueda, y limpiar trae la lista actualizada', async () => {
    renderAs('Administrator', <StadiumsPage />);
    await screen.findByText('Latinoamericano');

    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'Latino' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await waitFor(() => {
      expect(api.searchStadiums).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Nuevo estadio' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Nombre'), {
      target: { value: created.name },
    });
    fireEvent.change(within(dialog).getByLabelText('Capacidad'), {
      target: { value: String(created.capacity) },
    });
    fireEvent.change(within(dialog).getByLabelText('Provincia'), {
      target: { value: created.province },
    });
    api.getStadiums.mockResolvedValue([latino, created]);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    // La búsqueda sigue aplicada: el estadio nuevo no la cumple.
    await waitFor(() => {
      expect(api.searchStadiums).toHaveBeenCalledTimes(2);
    });
    expect(api.searchStadiums).toHaveBeenLastCalledWith({
      name: 'Latino',
      province: undefined,
      capacity: undefined,
    });
    expect(screen.queryByText(created.name)).toBeNull();

    fireEvent.click(
      screen.getByRole('button', { name: 'Limpiar filtros' }),
    );

    expect(await screen.findByText(created.name)).toBeTruthy();
  });
});
