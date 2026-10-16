import api from './client';

export async function downloadReportPdf(
  endpoint: string,
  filename: string,
): Promise<void> {
  const response = await api.get(endpoint, {
    responseType: 'blob',
  });

  const blob =
    response.data instanceof Blob
      ? response.data
      : new Blob([response.data], {
          type: 'application/pdf',
        });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);
}
