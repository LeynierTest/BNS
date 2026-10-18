import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderAs } from '../../test/render-as';
import EmailReportButton from './EmailReportButton';

const api = vi.hoisted(() => ({
  sendReportEmail: vi.fn(),
}));

vi.mock('../../api/reportEmail', () => api);

function openDialog() {
  fireEvent.click(
    screen.getByRole('button', { name: 'Enviar por correo' }),
  );

  return screen.getByLabelText('Correo electrónico') as HTMLInputElement;
}

describe('EmailReportButton · destinatario', () => {
  beforeEach(() => {
    api.sendReportEmail.mockResolvedValue({
      message: 'Reporte enviado correctamente por correo.',
      recipient: 'prueba@bns.test',
      report: 'Tabla de Posiciones',
      filename: 'tabla-posiciones.pdf',
    });
  });

  it('un Usuario envía a su propio correo, que no puede cambiar', async () => {
    renderAs('User', <EmailReportButton report="standings" />);
    const input = openDialog();

    expect(input.value).toBe('prueba@bns.test');
    expect(input.readOnly).toBe(true);
    expect(
      screen.getByText(
        'Los reportes se envían a tu correo. Solo un administrador puede enviarlos a otra dirección.',
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(
      await screen.findByText('Reporte enviado correctamente por correo.'),
    ).toBeTruthy();
    expect(api.sendReportEmail).toHaveBeenCalledWith({
      recipient: 'prueba@bns.test',
      report: 'standings',
    });
  });

  it('un Administrator elige el destinatario', () => {
    renderAs('Administrator', <EmailReportButton report="standings" />);
    const input = openDialog();

    expect(input.value).toBe('');
    expect(input.readOnly).toBe(false);
  });
});
