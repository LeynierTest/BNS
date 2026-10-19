import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  CircleDot,
  MapPin,
  Shield,
  ShieldCheck,
  Tag,
  Trophy,
  Users,
  UsersRound,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '../api/api-error';
import { getMatches } from '../api/matches';
import { getPlayers } from '../api/players';
import { getStadiums } from '../api/stadiums';
import { getStandings } from '../api/standings';
import { getTeams } from '../api/teams';
import {
  createSeason,
  getSeasonTeams,
  getSeries,
  updateSeasonTeams,
} from '../api/seasons';
import { useAuth } from '../auth/use-auth';
import { Modal } from '../components/ui/Modal';
import { SeasonForm } from '../components/ui/SeasonForm';
import { SeasonPanel } from '../components/ui/SeasonPanel';
import { SeasonTeamsForm } from '../components/ui/SeasonTeamsForm';
import { useSeason, useSelectedSeason } from '../season/use-season';
import { connectDashboardEvents } from '../api/dashboard-events';
import type { Match } from '../types/match';
import type { Player } from '../types/player';
import type { Stadium } from '../types/stadium';
import type { Standing } from '../types/standing';
import type { CreateSeasonData, Series } from '../types/season';
import type { Team } from '../types/team';
import './DashboardPage.css';

export function DashboardPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const [standings, setStandings] = useState<Standing[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  const { seasons, selectSeason, reloadSeasons } = useSeason();
  const selectedSeason = useSelectedSeason();
  const seasonId = selectedSeason.season_id;
  const isAdministrator = user?.role === 'Administrator';
  const [series, setSeries] = useState<Series[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  // Equipos inscritos que se editan (null = modal cerrado).
  const [editingTeamIds, setEditingTeamIds] = useState<number[] | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const locale =
    i18n.resolvedLanguage === 'en'
      ? 'en-US'
      : 'es-ES';

  useEffect(() => {
    // Descarta la respuesta si otra recarga la reemplazó o la página se desmontó.
    let ignore = false;

    async function loadDashboard() {
      try {
        const [
          standingsData,
          teamsData,
          playersData,
          stadiumsData,
          matchesData,
          seriesData,
        ] = await Promise.all([
          getStandings(seasonId),
          getTeams(),
          getPlayers(),
          getStadiums(),
          getMatches(seasonId),
          getSeries(),
        ]);

        if (ignore) {
          return;
        }

        setStandings(standingsData);
        setTeams(teamsData);
        setPlayers(playersData);
        setStadiums(stadiumsData);
        setMatches(matchesData);
        setSeries(seriesData);
        setError('');
      } catch {
        if (!ignore) {
          setError(t('dashboard.error'));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      ignore = true;
    };
  }, [reloadCount, seasonId, t]);

  useEffect(() => {
    const disconnect =
      connectDashboardEvents({
        onEvent: () => {
          setReloadCount((count) => count + 1);
        },
      });

    return disconnect;
  }, []);

  async function handleCreateSeason(data: CreateSeasonData) {
    setCreateLoading(true);
    setCreateError(null);

    try {
      const created = await createSeason(data);

      setCreateOpen(false);
      selectSeason(created.season_id);
      reloadSeasons();
    } catch (requestError) {
      setCreateError(
        getApiErrorMessage(requestError, t('seasons.createError')),
      );
    } finally {
      setCreateLoading(false);
    }
  }

  async function openEditTeams() {
    setEditError(null);

    try {
      const enrolled = await getSeasonTeams(seasonId);

      setEditingTeamIds(enrolled.map((team) => team.team_id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, t('seasons.loadError')));
    }
  }

  async function handleUpdateTeams(teamIds: number[]) {
    setEditLoading(true);
    setEditError(null);

    try {
      await updateSeasonTeams(seasonId, teamIds);
      setEditingTeamIds(null);
      reloadSeasons();
      setReloadCount((count) => count + 1);
    } catch (requestError) {
      setEditError(
        getApiErrorMessage(requestError, t('seasons.updateError')),
      );
    } finally {
      setEditLoading(false);
    }
  }

  const recentMatches = useMemo(
    () =>
      [...matches]
        .sort(
          (a, b) =>
            new Date(b.match_date).getTime() -
            new Date(a.match_date).getTime(),
        )
        .slice(0, 4),
    [matches],
  );

  const leader = standings[0];

  return (
    <section className="dashboard-page">
      <header className="dashboard-heading">
        <div>
          <span className="dashboard-eyebrow">
            {t('dashboard.eyebrow')}
          </span>

          <h2>
            {t('dashboard.greeting')}, {user?.username}
          </h2>

          <p>
            {t('dashboard.description')}
          </p>
        </div>

        <div className="dashboard-role">
          <div className="dashboard-role-heading">
            <ShieldCheck
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />

            <span>
              {t('dashboard.session')}
            </span>
          </div>

          <strong>
            {user?.role === 'Administrator'
              ? t('common.roles.administrator')
              : t('common.roles.user')}
          </strong>
        </div>
      </header>

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      <SeasonPanel
        seasons={seasons}
        selectedSeason={selectedSeason}
        canManage={isAdministrator}
        onSelect={selectSeason}
        onCreate={() => {
          setCreateError(null);
          setCreateOpen(true);
        }}
        onEditTeams={() => void openEditTeams()}
      />

      <Modal
        open={createOpen}
        title={t('seasons.createTitle')}
        onClose={() => {
          if (!createLoading) {
            setCreateOpen(false);
          }
        }}
      >
        <SeasonForm
          series={series}
          teams={teams}
          defaultSeriesId={selectedSeason.series_id}
          loading={createLoading}
          error={createError}
          onSubmit={handleCreateSeason}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal
        open={editingTeamIds !== null}
        title={t('seasons.editTeamsTitle')}
        onClose={() => {
          if (!editLoading) {
            setEditingTeamIds(null);
          }
        }}
      >
        {editingTeamIds && (
          <SeasonTeamsForm
            key={seasonId}
            teams={teams}
            initialTeamIds={editingTeamIds}
            loading={editLoading}
            error={editError}
            onSubmit={handleUpdateTeams}
            onCancel={() => setEditingTeamIds(null)}
          />
        )}
      </Modal>

      <section className="dashboard-stats">
        <article className="dashboard-stat">
          <div className="dashboard-stat-top">
            <span className="dashboard-stat-label">
              {t('dashboard.stats.teams')}
            </span>

            <span
              className="dashboard-stat-icon"
              aria-hidden="true"
            >
              <Shield
                size={19}
                strokeWidth={1.9}
              />
            </span>
          </div>

          <strong>
            {loading ? '—' : selectedSeason.team_count}
          </strong>

          <small>
            {t('dashboard.stats.teamsDescription')}
          </small>
        </article>

        <article className="dashboard-stat">
          <div className="dashboard-stat-top">
            <span className="dashboard-stat-label">
              {t('dashboard.stats.players')}
            </span>

            <span
              className="dashboard-stat-icon"
              aria-hidden="true"
            >
              <UsersRound
                size={19}
                strokeWidth={1.9}
              />
            </span>
          </div>

          <strong>{players.length}</strong>

          <small>
            {t('dashboard.stats.playersDescription')}
          </small>
        </article>

        <article className="dashboard-stat">
          <div className="dashboard-stat-top">
            <span className="dashboard-stat-label">
              {t('dashboard.stats.matches')}
            </span>

            <span
              className="dashboard-stat-icon"
              aria-hidden="true"
            >
              <CalendarDays
                size={19}
                strokeWidth={1.9}
              />
            </span>
          </div>

          <strong>
            {loading ? '—' : matches.length}
          </strong>

          <small>
            {t('dashboard.stats.matchesDescription')}
          </small>
        </article>

        <article className="dashboard-stat">
          <div className="dashboard-stat-top">
            <span className="dashboard-stat-label">
              {t('dashboard.stats.stadiums')}
            </span>

            <span
              className="dashboard-stat-icon"
              aria-hidden="true"
            >
              <Building2
                size={19}
                strokeWidth={1.9}
              />
            </span>
          </div>

          <strong>
            {loading ? '—' : stadiums.length}
          </strong>

          <small>
            {t('dashboard.stats.stadiumsDescription')}
          </small>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-panel standings-panel">
          <div className="dashboard-panel-heading">
            <div className="dashboard-panel-title">
              <span
                className="dashboard-panel-icon"
                aria-hidden="true"
              >
                <Trophy
                  size={18}
                  strokeWidth={1.9}
                />
              </span>

              <div>
                <span className="dashboard-eyebrow">
                  {t('dashboard.standings.eyebrow')}
                </span>

                <h3>
                  {t('dashboard.standings.title')}
                </h3>
              </div>
            </div>

            {leader && (
              <div className="dashboard-leader">
                <span>
                  {t('dashboard.standings.leader')}
                </span>

                <strong>
                  {leader.team_name}
                </strong>
              </div>
            )}
          </div>

          {loading ? (
            <p className="dashboard-empty">
              {t('dashboard.standings.loading')}
            </p>
          ) : standings.length === 0 ? (
            <p className="dashboard-empty">
              {t('dashboard.standings.empty')}
            </p>
          ) : (
            <div className="standings-list">
              {standings.slice(0, 6).map((team, index) => (
                <div
                  className={`standing-row ${
                    index === 0 ? 'is-leader' : ''
                  }`}
                  key={team.team_id}
                >
                  <span className="standing-position">
                    {index + 1}
                  </span>

                  <div className="standing-team">
                    <strong>
                      {team.team_name}
                    </strong>

                    <span>
                      {team.games_played}{' '}
                      {t('dashboard.standings.games')}
                    </span>
                  </div>

                  <strong className="standing-points">
                    {team.points}
                    <small>
                      {' '}
                      {t('dashboard.standings.points')}
                    </small>
                  </strong>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="dashboard-panel matches-panel">
          <div className="dashboard-panel-heading">
            <div className="dashboard-panel-title">
              <span
                className="dashboard-panel-icon"
                aria-hidden="true"
              >
                <CircleDot
                  size={18}
                  strokeWidth={1.9}
                />
              </span>

              <div>
                <span className="dashboard-eyebrow">
                  {t('dashboard.recentMatches.eyebrow')}
                </span>

                <h3>
                  {t('dashboard.recentMatches.title')}
                </h3>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="dashboard-empty">
              {t('dashboard.recentMatches.loading')}
            </p>
          ) : recentMatches.length === 0 ? (
            <p className="dashboard-empty">
              {t('dashboard.recentMatches.empty')}
            </p>
          ) : (
            <div className="recent-matches">
              {recentMatches.map((match) => (
                <article
                  className="match-card"
                  key={match.match_id}
                >
                  <div className="match-meta">
                    <span className="match-meta-item">
                      <CalendarDays
                        size={14}
                        strokeWidth={1.9}
                        aria-hidden="true"
                      />

                      {new Date(
                        match.match_date,
                      ).toLocaleDateString(locale, {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        timeZone: 'UTC',
                      })}
                    </span>

                    <span className="match-meta-item">
                      <Tag
                        size={14}
                        strokeWidth={1.9}
                        aria-hidden="true"
                      />

                      {match.phase_name}
                    </span>
                  </div>

                  <div className="match-teams">
                    <div>
                      <strong>
                        {match.visitor_team_name}
                      </strong>

                      <span>
                        {t('dashboard.recentMatches.away')}
                      </span>
                    </div>

                    <strong className="match-score">
                      {match.visitor_score}
                    </strong>
                  </div>

                  <div className="match-divider">
                    <span>
                      {t('dashboard.recentMatches.vs')}
                    </span>
                  </div>

                  <div className="match-teams">
                    <div>
                      <strong>
                        {match.home_team_name}
                      </strong>

                      <span>
                        {t('dashboard.recentMatches.home')}
                      </span>
                    </div>

                    <strong className="match-score">
                      {match.home_score}
                    </strong>
                  </div>

                  <div className="match-footer">
                    <span className="match-meta-item">
                      <MapPin
                        size={14}
                        strokeWidth={1.9}
                        aria-hidden="true"
                      />

                      {match.stadium_name}
                    </span>

                    <span className="match-meta-item">
                      <Users
                        size={14}
                        strokeWidth={1.9}
                        aria-hidden="true"
                      />

                      {match.audience.toLocaleString(
                        locale,
                      )}{' '}
                      {t(
                        'dashboard.recentMatches.attendees',
                      )}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>


    </section>
  );
}