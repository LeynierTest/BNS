import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getStadiumAttendance } from '../api/stadium-attendance';
import type { StadiumAttendance } from '../types/stadium-attendance';
import DataTable from '../components/ui/DataTable';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { EmptyState } from '../components/ui/EmptyState';
import { getApiErrorMessage } from '../api/api-error';
import './StadiumAttendancePage.css';
import { PdfDownloadButton } from '../components/ui/PdfDownloadButton';
import EmailReportButton from '../components/ui/EmailReportButton';
import { useSelectedSeason } from '../season/use-season';

export function StadiumAttendancePage() {
  const { t } = useTranslation();
  const { season_id: seasonId } = useSelectedSeason();

  const [stadiums, setStadiums] = useState<StadiumAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAttendance() {
      setLoading(true);
      setError(null);

      try {
        const data = await getStadiumAttendance(seasonId);

        if (active) {
          setStadiums(data);
        }
      } catch (err) {
        if (active) {
          setError(
            getApiErrorMessage(
              err,
              t('stadiumAttendance.loadError'),
            ),
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAttendance();

    return () => {
      active = false;
    };
  }, [seasonId, t]);

  const columns = [
    {
      key: 'position',
      header: t('stadiumAttendance.position'),
      render: (
        _stadium: StadiumAttendance,
        index: number,
      ) => (
        <span className="stadium-attendance-position">
          {index + 1}
        </span>
      ),
    },
    {
      key: 'stadium',
      header: t('stadiumAttendance.stadium'),
      render: (stadium: StadiumAttendance) => (
        <span className="stadium-attendance-name">
          {stadium.stadium_name}
        </span>
      ),
    },
    {
      key: 'capacity',
      header: t('stadiumAttendance.capacity'),
      render: (stadium: StadiumAttendance) =>
        stadium.capacity.toLocaleString(),
    },
    {
      key: 'games',
      header: t('stadiumAttendance.gamesPlayed'),
      render: (stadium: StadiumAttendance) =>
        stadium.games_played.toLocaleString(),
    },
    {
      key: 'attendance',
      header: t('stadiumAttendance.totalAttendance'),
      render: (stadium: StadiumAttendance) =>
        stadium.total_attendance.toLocaleString(),
    },
    {
      key: 'percentage',
      header: t('stadiumAttendance.percentage'),
      render: (stadium: StadiumAttendance) => (
        <span className="stadium-attendance-percentage">
          {stadium.attendance_percentage === null
            ? '—'
            : `${stadium.attendance_percentage.toFixed(2)}%`}
        </span>
      ),
    },
  ];

  return (
    <section className="stadium-attendance-page">
      <PageHeader
        eyebrow={t('stadiumAttendance.eyebrow')}
        title={t('stadiumAttendance.title')}
        description={t('stadiumAttendance.description')}
      />

      {loading && (
        <LoadingState
          message={t('stadiumAttendance.loading')}
        />
      )}

      {!loading && error && (
        <ErrorMessage message={error} />
      )}

      {!loading && !error && stadiums.length === 0 && (
        <EmptyState
          title={t('stadiumAttendance.emptyTitle')}
          description={t('stadiumAttendance.emptyDescription')}
        />
      )}

      {!loading && !error && stadiums.length > 0 && (
        <>
          <div className="report-actions">
            <PdfDownloadButton
              endpoint={`/reports/pdf/stadium-attendance?season_id=${seasonId}`}
              filename="asistencia-por-estadio.pdf"
            />
            <EmailReportButton
              report="stadium-attendance"
              params={{ seasonId }}
            />
          </div>

          <DataTable
            columns={columns}
            data={stadiums}
            getRowKey={(stadium: StadiumAttendance) =>
              stadium.stadium_name
            }
          />
        </>
      )}
    </section>
  );
}
