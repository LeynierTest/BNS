import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getTeams } from '../api/teams';
import { getTeamStatus } from '../api/team-status';
import type { Team } from '../types/team';
import type { TeamStatus } from '../types/team-status';
import DataTable from '../components/ui/DataTable';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { EmptyState } from '../components/ui/EmptyState';
import { getApiErrorMessage } from '../api/api-error';
import './TeamStatusPage.css';
import { PdfDownloadButton } from '../components/ui/PdfDownloadButton';
import EmailReportButton from '../components/ui/EmailReportButton';
import { useSelectedSeason } from '../season/use-season';

export function TeamStatusPage() {
  const { t } = useTranslation();
  const { season_id: seasonId } = useSelectedSeason();

  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState('');
  const [status, setStatus] = useState<TeamStatus[]>([]);

  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loading, setLoading] = useState(false);

  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadTeams() {
      setLoadingTeams(true);
      setTeamsError(null);

      try {
        const data = await getTeams();

        if (active) {
          setTeams(data);
        }
      } catch (err) {
        if (active) {
          setTeamsError(
            getApiErrorMessage(
              err,
              t('teamStatus.teamsLoadError'),
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

  async function handleSearch() {
    if (!teamId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getTeamStatus(Number(teamId), seasonId);
      setStatus(data);
      setHasSearched(true);
    } catch (err) {
      setStatus([]);
      setHasSearched(true);
      setError(
        getApiErrorMessage(
          err,
          t('teamStatus.loadError'),
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    {
      key: 'phase',
      header: t('teamStatus.phase'),
      render: (item: TeamStatus) => (
        <span className="team-status-phase">
          {item.phase_name}
        </span>
      ),
    },
    {
      key: 'total',
      header: t('teamStatus.total'),
      render: (item: TeamStatus) => (
        <div className="team-status-record">
          <span className="team-status-wins">
            {item.games_won_total} {t('teamStatus.wins')}
          </span>
          <span className="team-status-losses">
            {item.games_lost_total} {t('teamStatus.losses')}
          </span>
        </div>
      ),
    },
    {
      key: 'away',
      header: t('teamStatus.away'),
      render: (item: TeamStatus) => (
        <div className="team-status-record">
          <span className="team-status-wins">
            {item.games_won_away} {t('teamStatus.wins')}
          </span>
          <span className="team-status-losses">
            {item.games_lost_away} {t('teamStatus.losses')}
          </span>
        </div>
      ),
    },
    {
      key: 'home',
      header: t('teamStatus.home'),
      render: (item: TeamStatus) => (
        <div className="team-status-record">
          <span className="team-status-wins">
            {item.games_won_home} {t('teamStatus.wins')}
          </span>
          <span className="team-status-losses">
            {item.games_lost_home} {t('teamStatus.losses')}
          </span>
        </div>
      ),
    },
  ];

  return (
    <section className="team-status-page">
      <PageHeader
        eyebrow={t('teamStatus.eyebrow')}
        title={t('teamStatus.title')}
        description={t('teamStatus.description')}
      />

      {loadingTeams && (
        <LoadingState
          message={t('teamStatus.loadingTeams')}
        />
      )}

      {!loadingTeams && teamsError && (
        <ErrorMessage message={teamsError} />
      )}

      {!loadingTeams && !teamsError && (
        <div className="team-status-filters">
          <Select
            label={t('teamStatus.teamLabel')}
            value={teamId}
            onChange={(event) =>
              setTeamId(event.target.value)
            }
            options={teamOptions}
            placeholder={t('teamStatus.selectTeam')}
          />

          <div className="team-status-search">
            <Button
              type="button"
              onClick={handleSearch}
              disabled={!teamId || loading}
              loading={loading}
            >
              {t('teamStatus.search')}
            </Button>
          </div>
        </div>
      )}

      {loading && (
        <LoadingState
          message={t('teamStatus.loading')}
        />
      )}

      {!loading && error && (
        <ErrorMessage message={error} />
      )}

      {!loading &&
        !error &&
        hasSearched &&
        status.length === 0 && (
          <EmptyState
            title={t('teamStatus.emptyTitle')}
            description={t('teamStatus.emptyDescription')}
          />
        )}

      {!loading &&
        !error &&
        status.length > 0 && (
          <>
            <div className="report-actions">
              <PdfDownloadButton
                endpoint={`/reports/pdf/team-status/${teamId}?season_id=${seasonId}`}
                filename="estado-del-equipo.pdf"
              />
              <EmailReportButton
                report="team-status"
                params={{
                  teamId: Number(teamId),
                  seasonId,
                }}
              />
            </div>
            <DataTable
              columns={columns}
              data={status}
              getRowKey={(item: TeamStatus) =>
                item.phase_name
              }
            />
          </>
        )}
    </section>
  );
}
