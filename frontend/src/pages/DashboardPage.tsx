import { useCallback, useEffect, useMemo, useState } from 'react';
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
import api from '../api/client';
import { useAuth } from '../auth/use-auth';
import { connectDashboardEvents } from '../api/dashboard-events';
import './DashboardPage.css';

type Standing = {
  team_id: number;
  team_name: string;
  games_played: number;
  points: number;
};

type Team = {
  team_id: number;
  name: string;
};

type Stadium = {
  stadium_id: number;
  name: string;
};

type MatchTeam = {
  team_id: number;
  name: string;
};

type Match = {
  match_id: number;
  match_date: string;
  away_score: number;
  home_score: number;
  attendance: number;
  team_match_away_team_idToteam: MatchTeam;
  team_match_home_team_idToteam: MatchTeam;
  stadium: {
    stadium_id: number;
    name: string;
  };
  phase: {
    phase_id: number;
    name: string;
  };
};

export function DashboardPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const [standings, setStandings] = useState<Standing[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<unknown[]>([]);
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const locale =
    i18n.resolvedLanguage === 'en'
      ? 'en-US'
      : 'es-ES';

  const loadDashboard = useCallback(async () => {
    try {
      const [
        standingsResponse,
        teamsResponse,
        playersResponse,
        stadiumsResponse,
        matchesResponse,
      ] = await Promise.all([
        api.get<Standing[]>('/standings'),
        api.get<Team[]>('/teams'),
        api.get<unknown[]>('/players'),
        api.get<Stadium[]>('/stadiums'),
        api.get<Match[]>('/matches'),
      ]);

      setStandings(standingsResponse.data);
      setTeams(teamsResponse.data);
      setPlayers(playersResponse.data);
      setStadiums(stadiumsResponse.data);
      setMatches(matchesResponse.data);
    } catch {
      setError(t('dashboard.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const disconnect =
      connectDashboardEvents({
        onEvent: () => {
          void loadDashboard();
        },
      });

    return disconnect;
  }, [loadDashboard]);

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
            {loading ? '—' : teams.length}
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
                      })}
                    </span>

                    <span className="match-meta-item">
                      <Tag
                        size={14}
                        strokeWidth={1.9}
                        aria-hidden="true"
                      />

                      {match.phase.name}
                    </span>
                  </div>

                  <div className="match-teams">
                    <div>
                      <strong>
                        {
                          match
                            .team_match_away_team_idToteam
                            .name
                        }
                      </strong>

                      <span>
                        {t('dashboard.recentMatches.away')}
                      </span>
                    </div>

                    <strong className="match-score">
                      {match.away_score}
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
                        {
                          match
                            .team_match_home_team_idToteam
                            .name
                        }
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

                      {match.stadium.name}
                    </span>

                    <span className="match-meta-item">
                      <Users
                        size={14}
                        strokeWidth={1.9}
                        aria-hidden="true"
                      />

                      {match.attendance.toLocaleString(
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