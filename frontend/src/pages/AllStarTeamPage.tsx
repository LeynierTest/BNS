import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllStarTeam } from '../api/all-star-team';
import type { AllStarPlayer } from '../types/all-star-player';
import DataTable from '../components/ui/DataTable';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { EmptyState } from '../components/ui/EmptyState';
import { getApiErrorMessage } from '../api/api-error';
import './AllStarTeamPage.css';
import { PdfDownloadButton } from '../components/ui/PdfDownloadButton';
import EmailReportButton from '../components/ui/EmailReportButton';
import { PitcherStatsCard } from '../components/ui/PitcherStatsCard';

export function AllStarTeamPage() {
  const { t } = useTranslation();

  const [players, setPlayers] = useState<AllStarPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAllStarTeam() {
      setLoading(true);
      setError(null);

      try {
        const data = await getAllStarTeam();

        if (active) {
          setPlayers(data);
        }
      } catch (err) {
        if (active) {
          setError(
            getApiErrorMessage(
              err,
              t('allStarTeam.loadError'),
            ),
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAllStarTeam();

    return () => {
      active = false;
    };
  }, [t]);

  const columns = [
    {
      key: 'position',
      header: t('allStarTeam.position'),
      render: (player: AllStarPlayer) => (
        <span className="all-star-position">
          {player.player_position}
        </span>
      ),
    },
    {
      key: 'player',
      header: t('allStarTeam.player'),
      render: (player: AllStarPlayer) => (
        <span className="all-star-player">
          {player.player_name}
        </span>
      ),
    },
    {
      key: 'team',
      header: t('allStarTeam.team'),
      render: (player: AllStarPlayer) => (
        <span className="all-star-team">
          {player.team_name}
        </span>
      ),
    },
    {
      key: 'average',
      header: t('allStarTeam.average'),
      // De bateo en cada posición; el del lanzador es su ERA.
      render: (player: AllStarPlayer) => (
        <span className="all-star-average">
          {player.pitching
            ? `${player.pitching.era.toFixed(2)} ERA`
            : (player.batting_average?.toFixed(3) ?? '—')}
        </span>
      ),
    },
  ];

  return (
    <section className="all-star-team-page">
      <PageHeader
        eyebrow={t('allStarTeam.eyebrow')}
        title={t('allStarTeam.title')}
        description={t('allStarTeam.description')}
      />

      {loading && (
        <LoadingState
          message={t('allStarTeam.loading')}
        />
      )}

      {!loading && error && (
        <ErrorMessage message={error} />
      )}

      {!loading &&
        !error &&
        players.length === 0 && (
          <EmptyState
            title={t('allStarTeam.emptyTitle')}
            description={t('allStarTeam.emptyDescription')}
          />
        )}

      {!loading &&
        !error &&
        players.length > 0 && (
          <>
            <div className="report-actions">
              <PdfDownloadButton
                endpoint="/reports/pdf/all-star-team"
                filename="equipo-todos-estrellas.pdf"
              />
              <EmailReportButton report="all-star-team" />
            </div>

            <DataTable
            columns={columns}
            data={players}
            getRowKey={(player: AllStarPlayer) =>
              `${player.player_position}-${player.player_name}`
            }
          />

            {players.map((player) =>
              player.pitching ? (
                <PitcherStatsCard
                  key={`${player.player_position}-${player.player_name}`}
                  playerName={player.player_name}
                  teamName={player.team_name}
                  pitching={player.pitching}
                />
              ) : null,
            )}
          </>
        )}
    </section>
  );
}
