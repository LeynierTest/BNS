import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DataTable, {
  type DataTableColumn,
} from '../components/ui/DataTable';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { getApiErrorMessage } from '../api/api-error';
import { getMatchesByDate } from '../api/matches-by-date';
import { getStadiums } from '../api/stadiums';
import type { MatchByDate } from '../types/matches-by-date';
import type { Stadium } from '../types/stadium';
import './MatchesByDatePage.css';
import { PdfDownloadButton } from '../components/ui/PdfDownloadButton';
import EmailReportButton from '../components/ui/EmailReportButton';

export function MatchesByDatePage() {
  const { t } = useTranslation();

  const [date, setDate] = useState('');
  const [stadiumId, setStadiumId] = useState('');

  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [matches, setMatches] = useState<MatchByDate[]>([]);

  const [loadingStadiums, setLoadingStadiums] =
    useState(true);
  const [loading, setLoading] = useState(false);

  const [stadiumsError, setStadiumsError] =
    useState('');
  const [error, setError] = useState('');

  const [hasSearched, setHasSearched] =
    useState(false);

  useEffect(() => {
    let active = true;

    async function loadStadiums() {
      try {
        setLoadingStadiums(true);
        setStadiumsError('');

        const data = await getStadiums();

        if (active) {
          setStadiums(data);
        }
      } catch (err) {
        if (active) {
          setStadiumsError(
            getApiErrorMessage(
              err,
              t('matchesByDate.stadiumsLoadError'),
            ),
          );
        }
      } finally {
        if (active) {
          setLoadingStadiums(false);
        }
      }
    }

    loadStadiums();

    return () => {
      active = false;
    };
  }, [t]);

  const stadiumOptions = useMemo(
    () =>
      stadiums.map((stadium) => ({
        value: stadium.stadium_id,
        label: stadium.name,
      })),
    [stadiums],
  );

  async function handleSearch() {
    if (!date) {
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const data = await getMatchesByDate(
        date,
        stadiumId
          ? Number(stadiumId)
          : undefined,
      );

      setMatches(data);
    } catch (err) {
      setMatches([]);
      setError(
        getApiErrorMessage(
          err,
          t('matchesByDate.loadError'),
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  const columns = useMemo<
    DataTableColumn<MatchByDate>[]
  >(
    () => [
      {
        key: 'date',
        header: t('matchesByDate.date'),
        render: (match) => {
          const datePart = String(match.match_date).split('T')[0];
          const [year, month, day] = datePart.split('-');

          return year && month && day
            ? `${day}/${month}/${year}`
            : datePart;
        },
      },
      {
        key: 'teams',
        header: t('matchesByDate.teams'),
        render: (match) => (
          <div className="matches-by-date-teams">
            <span>{match.away_team}</span>
            <strong>vs.</strong>
            <span>{match.home_team}</span>
          </div>
        ),
      },
      {
        key: 'score',
        header: t('matchesByDate.score'),
        render: (match) => (
          <strong>
            {match.away_score} - {match.home_score}
          </strong>
        ),
      },
      {
        key: 'stadium',
        header: t('matchesByDate.stadium'),
        render: (match) => match.stadium,
      },
      {
        key: 'phase',
        header: t('matchesByDate.phase'),
        render: (match) => match.phase,
      },
      {
        key: 'attendance',
        header: t('matchesByDate.attendance'),
        render: (match) =>
          match.attendance.toLocaleString(),
      },
    ],
    [t],
  );

  return (
    <section className="matches-by-date-page">
      <PageHeader
        eyebrow={t('matchesByDate.eyebrow')}
        title={t('matchesByDate.title')}
        description={t('matchesByDate.description')}
      />

      {loadingStadiums ? (
        <LoadingState
          message={t('matchesByDate.loadingStadiums')}
        />
      ) : stadiumsError ? (
        <ErrorMessage message={stadiumsError} />
      ) : (
        <div className="matches-by-date-filters">
          <Input
            type="date"
            label={t('matchesByDate.dateLabel')}
            value={date}
            onChange={(event) =>
              setDate(event.target.value)
            }
          />

          <Select
            label={t('matchesByDate.stadiumLabel')}
            options={stadiumOptions}
            value={stadiumId}
            onChange={(event) =>
              setStadiumId(event.target.value)
            }
            placeholder={t(
              'matchesByDate.allStadiums',
            )}
          />

          <div className="matches-by-date-search">
            <Button
              type="button"
              onClick={handleSearch}
              disabled={!date || loading}
              loading={loading}
            >
              {t('matchesByDate.search')}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState
          message={t('matchesByDate.loading')}
        />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : hasSearched && matches.length === 0 ? (
        <EmptyState
          title={t('matchesByDate.emptyTitle')}
          description={t(
            'matchesByDate.emptyDescription',
          )}
        />
      ) : matches.length > 0 ? (
        <>
          <div className="report-actions">
            <PdfDownloadButton
              endpoint={`/reports/pdf/matches-by-date/${date}${stadiumId ? `?stadiumId=${stadiumId}` : ''}`}
              filename="partidos-por-fecha.pdf"
            />
            <EmailReportButton
              report="matches-by-date"
              params={{
                date,
                ...(stadiumId
                  ? { stadiumId: Number(stadiumId) }
                  : {}),
              }}
            />
          </div>
                    <DataTable
            columns={columns}
            data={matches}
            getRowKey={(match) => match.match_id}
          />
        </>
      ) : null}
    </section>
  );
}
