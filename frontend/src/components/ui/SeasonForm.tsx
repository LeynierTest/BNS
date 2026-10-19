import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { CreateSeasonData, Series } from '../../types/season';
import type { Team } from '../../types/team';
import { Button } from './Button';
import { ErrorMessage } from './ErrorMessage';
import { Input } from './Input';
import { Select } from './Select';
import { TeamChecklist } from './TeamChecklist';
import './SeasonForm.css';

const NEW_SERIES = '__new__';

type SeasonFormProps = {
  series: Series[];
  teams: Team[];
  /** Serie preseleccionada (la de la temporada que se está viendo). */
  defaultSeriesId?: number;
  loading?: boolean;
  error?: string | null;
  onSubmit: (data: CreateSeasonData) => void | Promise<void>;
  onCancel: () => void;
};

/** Crea una temporada vacía en una Serie existente o en una nueva. */
export function SeasonForm({
  series,
  teams,
  defaultSeriesId,
  loading = false,
  error = null,
  onSubmit,
  onCancel,
}: SeasonFormProps) {
  const { t } = useTranslation();
  const [seriesId, setSeriesId] = useState(
    defaultSeriesId !== undefined
      ? String(defaultSeriesId)
      : series.length > 0
        ? String(series[0].series_id)
        : NEW_SERIES,
  );
  const [seriesName, setSeriesName] = useState('');
  const [name, setName] = useState('');
  // Por defecto juegan todos los equipos; se pueden quitar.
  const [teamIds, setTeamIds] = useState(teams.map((team) => team.team_id));
  const [errors, setErrors] = useState<{
    name?: string;
    seriesName?: string;
    teams?: string;
  }>({});

  const isNewSeries = seriesId === NEW_SERIES;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: typeof errors = {};

    if (!name.trim()) {
      nextErrors.name = t('seasons.validation.nameRequired');
    }

    if (isNewSeries && !seriesName.trim()) {
      nextErrors.seriesName = t('seasons.validation.seriesNameRequired');
    }

    if (teamIds.length < 2) {
      nextErrors.teams = t('seasons.validation.minTeams');
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    void onSubmit({
      name: name.trim(),
      ...(isNewSeries
        ? { series_name: seriesName.trim() }
        : { series_id: Number(seriesId) }),
      team_ids: teamIds,
    });
  }

  return (
    <form className="season-form" onSubmit={handleSubmit} noValidate>
      {error && <ErrorMessage message={error} />}

      <div className="season-form-grid">
        <Select
          label={t('seasons.series')}
          value={seriesId}
          onChange={(event) => setSeriesId(event.target.value)}
          disabled={loading}
          options={[
            ...series.map((item) => ({
              value: String(item.series_id),
              label: item.name,
            })),
            { value: NEW_SERIES, label: t('seasons.newSeries') },
          ]}
        />

        {isNewSeries && (
          <Input
            label={t('seasons.seriesName')}
            placeholder={t('seasons.seriesNamePlaceholder')}
            maxLength={100}
            value={seriesName}
            onChange={(event) => setSeriesName(event.target.value)}
            error={errors.seriesName}
            disabled={loading}
          />
        )}

        <Input
          label={t('seasons.name')}
          placeholder={t('seasons.namePlaceholder')}
          maxLength={100}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          disabled={loading}
          autoFocus
        />
      </div>

      <TeamChecklist
        teams={teams}
        selected={teamIds}
        onChange={setTeamIds}
        disabled={loading}
        error={errors.teams}
      />

      <p className="season-form-note">{t('seasons.createNote')}</p>

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
          {t('seasons.create')}
        </Button>
      </div>
    </form>
  );
}
