import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DataTable, {
  type DataTableColumn,
} from '../components/ui/DataTable';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { getApiErrorMessage } from '../api/api-error';
import { getStandings } from '../api/standings';
import type { Standing } from '../types/standing';
import './StandingsPage.css';
import { PdfDownloadButton } from '../components/ui/PdfDownloadButton';
import EmailReportButton from '../components/ui/EmailReportButton';

export function StandingsPage() {
  const { t } = useTranslation();

  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadStandings() {
      try {
        setLoading(true);
        setError('');

        const data = await getStandings();

        if (active) {
          setStandings(data);
        }
      } catch (err) {
        if (active) {
          setError(
            getApiErrorMessage(
              err,
              t('standings.loadError'),
            ),
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadStandings();

    return () => {
      active = false;
    };
  }, [t]);

  const columns = useMemo<DataTableColumn<Standing>[]>(
    () => [
      {
        key: 'position',
        header: t('standings.position'),
        render: (_team, index) => (
          <span className="standings-position">
            {index + 1}
          </span>
        ),
      },
      {
        key: 'team',
        header: t('standings.team'),
        render: (team) => (
          <strong className="standings-team-name">
            {team.team_name}
          </strong>
        ),
      },
      {
        key: 'gamesPlayed',
        header: t('standings.gamesPlayed'),
        render: (team) => team.games_played,
      },
      {
        key: 'points',
        header: t('standings.points'),
        render: (team) => (
          <strong className="standings-points">
            {team.points}
          </strong>
        ),
      },
    ],
    [t],
  );

  return (
    <section className="standings-page">
      <PageHeader
        eyebrow={t('standings.eyebrow')}
        title={t('standings.title')}
        description={t('standings.description')}
      />

      {loading ? (
        <LoadingState
          message={t('standings.loading')}
        />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : standings.length === 0 ? (
        <EmptyState
          title={t('standings.emptyTitle')}
          description={t('standings.emptyDescription')}
        />
      ) : (
        <div className="standings-table-wrapper">
          {standings.length > 0 ? (
            <div className="report-actions">
              <PdfDownloadButton
                endpoint="/reports/pdf/standings"
                filename="tabla-posiciones.pdf"
              />
              <EmailReportButton report="standings" />
            </div>
          ) : null}

          <DataTable
            columns={columns}
            data={standings}
            getRowKey={(team) => team.team_id}
          />
        </div>
      )}
    </section>
  );
}
