import { useTranslation } from 'react-i18next';
import { seasonLabel } from '../../types/season';
import type { Season } from '../../types/season';
import { Badge } from './Badge';
import { Button } from './Button';
import { Select } from './Select';
import './SeasonPanel.css';

const CREATE_OPTION = '__create__';

type SeasonPanelProps = {
  seasons: Season[];
  selectedSeason: Season;
  canManage: boolean;
  onSelect: (seasonId: number) => void;
  onCreate: () => void;
  onEditTeams: () => void;
};

/**
 * Selector de temporada del Dashboard: todas las temporadas y, al final,
 * "Crear nueva temporada" (solo administradores).
 */
export function SeasonPanel({
  seasons,
  selectedSeason,
  canManage,
  onSelect,
  onCreate,
  onEditTeams,
}: SeasonPanelProps) {
  const { t } = useTranslation();

  return (
    <section className="season-panel" aria-labelledby="season-panel-title">
      <div className="season-panel-select">
        <h2 id="season-panel-title">{t('seasons.panelTitle')}</h2>

        <Select
          label={t('seasons.selectLabel')}
          value={String(selectedSeason.season_id)}
          onChange={(event) => {
            if (event.target.value === CREATE_OPTION) {
              onCreate();
              return;
            }

            onSelect(Number(event.target.value));
          }}
          options={[
            ...seasons.map((season) => ({
              value: String(season.season_id),
              label: seasonLabel(season),
            })),
            ...(canManage
              ? [{ value: CREATE_OPTION, label: t('seasons.createOption') }]
              : []),
          ]}
        />
      </div>

      <div className="season-panel-facts">
        <Badge variant={selectedSeason.started ? 'success' : 'neutral'}>
          {selectedSeason.started
            ? t('seasons.started')
            : t('seasons.notStarted')}
        </Badge>
        <span>
          {t('seasons.facts', {
            teams: selectedSeason.team_count,
            phases: selectedSeason.phase_count,
            matches: selectedSeason.match_count,
          })}
        </span>
      </div>

      {canManage && (
        <div className="season-panel-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onEditTeams}
            disabled={selectedSeason.started}
          >
            {t('seasons.editTeams')}
          </Button>
          {selectedSeason.started && (
            <small>{t('seasons.lockedHint')}</small>
          )}
        </div>
      )}
    </section>
  );
}
