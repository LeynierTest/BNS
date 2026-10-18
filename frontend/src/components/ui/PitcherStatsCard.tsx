import { useTranslation } from 'react-i18next';

import type { PitchingStats } from '../../types/all-star-player';
import { Card } from './Card';
import './PitcherStatsCard.css';

const STATS = [
  { key: 'era', label: 'ERA' },
  { key: 'whip', label: 'WHIP' },
  { key: 'k_per_9', label: 'K/9' },
  { key: 'bb_per_9', label: 'BB/9' },
  { key: 'fip', label: 'FIP' },
] as const satisfies readonly { key: keyof PitchingStats; label: string }[];

type PitcherStatsCardProps = {
  playerName: string;
  teamName: string;
  pitching: PitchingStats;
};

/** Las cinco estadísticas del lanzador del equipo todos estrellas. */
export function PitcherStatsCard({
  playerName,
  teamName,
  pitching,
}: PitcherStatsCardProps) {
  const { t } = useTranslation();
  const incomplete = STATS.some(({ key }) => pitching[key] === null);

  return (
    <Card as="section" className="pitcher-stats">
      <header className="pitcher-stats-header">
        <h2>{t('allStarTeam.pitcherStats.title')}</h2>
        <p>
          {playerName} · {teamName}
        </p>
      </header>

      <dl className="pitcher-stats-grid">
        {STATS.map(({ key, label }) => (
          <div key={key} className="pitcher-stats-item">
            <dt>{label}</dt>
            <dd>{pitching[key]?.toFixed(2) ?? '—'}</dd>
            <small>{t(`allStarTeam.pitcherStats.${key}`)}</small>
          </div>
        ))}
      </dl>

      <p className="pitcher-stats-note">
        {t('allStarTeam.pitcherStats.selectionNote')}
      </p>

      {incomplete && (
        <p className="pitcher-stats-note">
          {t('allStarTeam.pitcherStats.incomplete')}
        </p>
      )}
    </Card>
  );
}
