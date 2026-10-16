import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DataTable, {
  type DataTableColumn,
} from '../components/ui/DataTable';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { getApiErrorMessage } from '../api/api-error';
import { getMatchesByTeams } from '../api/matches-by-teams';
import { getTeams } from '../api/teams';
import type { MatchByTeams } from '../types/matches-by-teams';
import type { Team } from '../types/team';
import './MatchesByTeamsPage.css';
import { PdfDownloadButton } from '../components/ui/PdfDownloadButton';
import EmailReportButton from '../components/ui/EmailReportButton';

export function MatchesByTeamsPage() {
  const { t } = useTranslation();

  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');

  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<MatchByTeams[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [error, setError] = useState('');
  const [teamsError, setTeamsError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadTeams() {
      try {
        setLoadingTeams(true);
        setTeamsError('');

        const data = await getTeams();

        if (active) {
          setTeams(data);
        }
      } catch (err) {
        if (active) {
          setTeamsError(
            getApiErrorMessage(
              err,
              t('matchesByTeams.teamsLoadError'),
            ),
          );
        }
      } finally {
        if (active) {
          setLoadingTeams(false);
        }
      }
    }

    loadTeams();

    return () => {
      active = false;
    };
  }, [t]);

  const teamOptions = useMemo(
    () =>
      teams.map((team) => ({
        value: team.team_id,
        label: team.name,
      })),
    [teams],
  );

  const availableAwayTeams = useMemo(
    () =>
      teamOptions.map((team) => ({
        ...team,
        disabled:
          homeTeamId !== '' &&
          String(team.value) === homeTeamId,
      })),
    [teamOptions, homeTeamId],
  );

  async function handleSearch() {
    if (!homeTeamId || !awayTeamId) {
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const data = await getMatchesByTeams(
        Number(homeTeamId),
        Number(awayTeamId),
      );

      setMatches(data);
    } catch (err) {
      setMatches([]);
      setError(
        getApiErrorMessage(
          err,
          t('matchesByTeams.loadError'),
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  const columns = useMemo<
    DataTableColumn<MatchByTeams>[]
  >(
    () => [
      {
        key: 'date',
        header: t('matchesByTeams.date'),
        render: (match) => {
          const date = match.match_date.slice(0, 10);
          const [year, month, day] = date
            .split('-')
            .map(Number);

          return new Date(
            year,
            month - 1,
            day,
          ).toLocaleDateString();
        },
      },
      {
        key: 'teams',
        header: t('matchesByTeams.teams'),
        render: (match) => (
          <div className="matches-by-teams-teams">
            <span>{match.away_team}</span>
            <strong>vs.</strong>
            <span>{match.home_team}</span>
          </div>
        ),
      },
      {
        key: 'score',
        header: t('matchesByTeams.score'),
        render: (match) => (
          <strong>
            {match.away_score} - {match.home_score}
          </strong>
        ),
      },
      {
        key: 'stadium',
        header: t('matchesByTeams.stadium'),
        render: (match) => match.stadium,
      },
      {
        key: 'phase',
        header: t('matchesByTeams.phase'),
        render: (match) => match.phase,
      },
      {
        key: 'attendance',
        header: t('matchesByTeams.attendance'),
        render: (match) =>
          match.attendance.toLocaleString(),
      },
    ],
    [t],
  );

  return (
    <section className="matches-by-teams-page">
      <PageHeader
        eyebrow={t('matchesByTeams.eyebrow')}
        title={t('matchesByTeams.title')}
        description={t('matchesByTeams.description')}
      />

      {loadingTeams ? (
        <LoadingState
          message={t('matchesByTeams.loadingTeams')}
        />
      ) : teamsError ? (
        <ErrorMessage message={teamsError} />
      ) : (
        <div className="matches-by-teams-filters">
          <Select
            label={t('matchesByTeams.homeTeam')}
            options={teamOptions}
            value={homeTeamId}
            onChange={(event) => {
              const value = event.target.value;

              setHomeTeamId(value);

              if (
                value !== '' &&
                value === awayTeamId
              ) {
                setAwayTeamId('');
              }
            }}
            placeholder={t(
              'matchesByTeams.selectHomeTeam',
            )}
          />

          <Select
            label={t('matchesByTeams.awayTeam')}
            options={availableAwayTeams}
            value={awayTeamId}
            onChange={(event) =>
              setAwayTeamId(event.target.value)
            }
            placeholder={t(
              'matchesByTeams.selectAwayTeam',
            )}
          />

          <div className="matches-by-teams-search">
            <Button
              type="button"
              onClick={handleSearch}
              disabled={
                !homeTeamId ||
                !awayTeamId ||
                loading
              }
              loading={loading}
            >
              {t('matchesByTeams.search')}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState
          message={t('matchesByTeams.loading')}
        />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : hasSearched && matches.length === 0 ? (
        <EmptyState
          title={t('matchesByTeams.emptyTitle')}
          description={t(
            'matchesByTeams.emptyDescription',
          )}
        />
      ) : matches.length > 0 ? (
        <>
          <div className="report-actions">
            <PdfDownloadButton
              endpoint={`/reports/pdf/matches-by-teams/${homeTeamId}/${awayTeamId}`}
              filename="partidos-por-equipos.pdf"
            />
            <EmailReportButton
              report="matches-by-teams"
              params={{
                homeTeamId: Number(homeTeamId),
                awayTeamId: Number(awayTeamId),
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
