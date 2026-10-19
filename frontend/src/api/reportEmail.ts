import api from './client';

export type ReportEmailType =
  | 'standings'
  | 'matches-by-teams'
  | 'matches-by-date'
  | 'top-coaches'
  | 'stadium-attendance'
  | 'team-status'
  | 'all-star-team';

export interface SendReportEmailData {
  recipient: string;
  report: ReportEmailType;
  homeTeamId?: number;
  awayTeamId?: number;
  date?: string;
  stadiumId?: number;
  teamId?: number;
  /** Temporada del reporte (los globales la ignoran). */
  seasonId?: number;
}

export interface SendReportEmailResponse {
  message: string;
  recipient: string;
  report: string;
  filename: string;
}

export async function sendReportEmail(
  data: SendReportEmailData,
): Promise<SendReportEmailResponse> {
  const response = await api.post<SendReportEmailResponse>(
    '/reports/email',
    data,
  );

  return response.data;
}
