import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Team } from '../../types/team';
import { Button } from './Button';
import { ErrorMessage } from './ErrorMessage';
import { TeamChecklist } from './TeamChecklist';
import './SeasonForm.css';

type SeasonTeamsFormProps = {
  teams: Team[];
  initialTeamIds: number[];
  loading?: boolean;
  error?: string | null;
  onSubmit: (teamIds: number[]) => void | Promise<void>;
  onCancel: () => void;
};

/** Equipos inscritos en una temporada que aún no ha empezado. */
export function SeasonTeamsForm({
  teams,
  initialTeamIds,
  loading = false,
  error = null,
  onSubmit,
  onCancel,
}: SeasonTeamsFormProps) {
  const { t } = useTranslation();
  const [teamIds, setTeamIds] = useState(initialTeamIds);
  const [validationError, setValidationError] = useState<string>();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (teamIds.length < 2) {
      setValidationError(t('seasons.validation.minTeams'));
      return;
    }

    setValidationError(undefined);
    void onSubmit(teamIds);
  }

  return (
    <form className="season-form" onSubmit={handleSubmit} noValidate>
      {error && <ErrorMessage message={error} />}

      <TeamChecklist
        teams={teams}
        selected={teamIds}
        onChange={setTeamIds}
        disabled={loading}
        error={validationError}
      />

      <div className="season-form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={loading}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
