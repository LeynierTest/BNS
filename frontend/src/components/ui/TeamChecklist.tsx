import { useTranslation } from 'react-i18next';
import type { Team } from '../../types/team';
import './TeamChecklist.css';

type TeamChecklistProps = {
  teams: Team[];
  selected: number[];
  onChange: (teamIds: number[]) => void;
  disabled?: boolean;
  error?: string;
};

/** Casillas para elegir los equipos inscritos en una temporada. */
export function TeamChecklist({
  teams,
  selected,
  onChange,
  disabled = false,
  error,
}: TeamChecklistProps) {
  const { t } = useTranslation();
  const selectedIds = new Set(selected);

  function toggle(teamId: number) {
    onChange(
      selectedIds.has(teamId)
        ? selected.filter((id) => id !== teamId)
        : [...selected, teamId],
    );
  }

  return (
    <fieldset className="team-checklist" disabled={disabled}>
      <legend>
        {t('seasons.teams')} ({selected.length}/{teams.length})
      </legend>

      <div className="team-checklist-actions">
        <button
          type="button"
          onClick={() => onChange(teams.map((team) => team.team_id))}
        >
          {t('seasons.selectAll')}
        </button>
        <button type="button" onClick={() => onChange([])}>
          {t('seasons.selectNone')}
        </button>
      </div>

      <div className="team-checklist-grid">
        {teams.map((team) => (
          <label key={team.team_id} className="team-checklist-item">
            <input
              type="checkbox"
              checked={selectedIds.has(team.team_id)}
              onChange={() => toggle(team.team_id)}
            />
            <span>{team.name}</span>
          </label>
        ))}
      </div>

      {error && (
        <p className="team-checklist-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
