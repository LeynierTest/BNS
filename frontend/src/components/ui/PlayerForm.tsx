import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FormEvent } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import type { PlayerFormData } from '../../api/players';
import type { Team } from '../../types/team';
import './PlayerForm.css';

type PlayerFormProps = {
  teams: Team[];
  initialValues?: Partial<PlayerFormData>;
  onSubmit: (data: PlayerFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  serverError?: string;
};

type FormValues = {
  name: string;
  number: string;
  years_on_team: string;
  team_id: string;
  position: string;
  at_bats: string;
  innings_pitched: string;
  hits: string;
  runs_allowed: string;
  batting_average: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const positions = [
  'Receptor',
  'Primera Base',
  'Segunda Base',
  'Tercera Base',
  'Torpedero',
  'Jardinero',
  'Lanzador',
];

export function PlayerForm({
  teams,
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
  serverError = '',
}: PlayerFormProps) {
  const { t } = useTranslation();

  const [values, setValues] = useState<FormValues>({
    name: initialValues?.name ?? '',
    number:
      initialValues?.number !== undefined
        ? String(initialValues.number)
        : '',
    years_on_team:
      initialValues?.years_on_team !== undefined
        ? String(initialValues.years_on_team)
        : '',
    team_id:
      initialValues?.team_id !== undefined
        ? String(initialValues.team_id)
        : '',
    position: initialValues?.position ?? '',
    at_bats:
      initialValues?.at_bats !== null &&
      initialValues?.at_bats !== undefined
        ? String(initialValues.at_bats)
        : '',
    innings_pitched:
      initialValues?.innings_pitched !== null &&
      initialValues?.innings_pitched !== undefined
        ? String(initialValues.innings_pitched)
        : '',
    hits:
      initialValues?.hits !== null &&
      initialValues?.hits !== undefined
        ? String(initialValues.hits)
        : '',
    runs_allowed:
      initialValues?.runs_allowed !== null &&
      initialValues?.runs_allowed !== undefined
        ? String(initialValues.runs_allowed)
        : '',
    batting_average:
      initialValues?.batting_average !== undefined
        ? String(initialValues.batting_average)
        : '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const isPitcher = values.position === 'Lanzador';

  const updateValue = (field: keyof FormValues, value: string) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!values.name.trim()) {
      nextErrors.name = t('players.form.validation.required');
    }

    if (!values.number) {
      nextErrors.number = t('players.form.validation.required');
    } else if (
      !Number.isInteger(Number(values.number)) ||
      Number(values.number) < 1
    ) {
      nextErrors.number = t(
        'players.form.validation.positiveInteger',
      );
    }

    if (!values.years_on_team) {
      nextErrors.years_on_team = t(
        'players.form.validation.required',
      );
    } else if (
      !Number.isInteger(Number(values.years_on_team)) ||
      Number(values.years_on_team) < 0
    ) {
      nextErrors.years_on_team = t(
        'players.form.validation.nonNegativeInteger',
      );
    }

    if (!values.team_id) {
      nextErrors.team_id = t('players.form.validation.required');
    }

    if (!values.position) {
      nextErrors.position = t('players.form.validation.required');
    }

    if (values.batting_average.trim() === '') {
      nextErrors.batting_average = t(
        'players.form.validation.required',
      );
    } else {
      const average = Number(values.batting_average);

      if (
        Number.isNaN(average) ||
        average < 0 ||
        average > 1
      ) {
        nextErrors.batting_average = t(
          'players.form.validation.average',
        );
      }
    }

    if (isPitcher) {
      if (values.innings_pitched.trim() === '') {
        nextErrors.innings_pitched = t(
          'players.form.validation.required',
        );
      } else if (
        Number.isNaN(Number(values.innings_pitched)) ||
        Number(values.innings_pitched) < 0
      ) {
        nextErrors.innings_pitched = t(
          'players.form.validation.nonNegativeNumber',
        );
      }

      if (values.runs_allowed.trim() === '') {
        nextErrors.runs_allowed = t(
          'players.form.validation.required',
        );
      } else if (
        !Number.isInteger(Number(values.runs_allowed)) ||
        Number(values.runs_allowed) < 0
      ) {
        nextErrors.runs_allowed = t(
          'players.form.validation.nonNegativeInteger',
        );
      }
    } else {
      if (values.at_bats.trim() === '') {
        nextErrors.at_bats = t(
          'players.form.validation.required',
        );
      } else if (
        !Number.isInteger(Number(values.at_bats)) ||
        Number(values.at_bats) < 0
      ) {
        nextErrors.at_bats = t(
          'players.form.validation.nonNegativeInteger',
        );
      }

      if (values.hits.trim() === '') {
        nextErrors.hits = t(
          'players.form.validation.required',
        );
      } else if (
        !Number.isInteger(Number(values.hits)) ||
        Number(values.hits) < 0
      ) {
        nextErrors.hits = t(
          'players.form.validation.nonNegativeInteger',
        );
      }
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const data: PlayerFormData = {
      name: values.name.trim(),
      number: Number(values.number),
      years_on_team: Number(values.years_on_team),
      team_id: Number(values.team_id),
      position: values.position,
      at_bats: isPitcher ? null : Number(values.at_bats),
      innings_pitched: isPitcher
        ? Number(values.innings_pitched)
        : null,
      hits: isPitcher ? null : Number(values.hits),
      runs_allowed: isPitcher
        ? Number(values.runs_allowed)
        : null,
      batting_average: Number(values.batting_average),
    };

    await onSubmit(data);
  };

  return (
    <form className="player-form" onSubmit={handleSubmit} noValidate>
      <div className="player-form-grid">
        <Input
          label={t('players.form.name')}
          value={values.name}
          onChange={(event) =>
            updateValue('name', event.target.value)
          }
          error={errors.name}
          disabled={loading}
        />

        <Input
          label={t('players.form.number')}
          type="number"
          min="1"
          value={values.number}
          onChange={(event) =>
            updateValue('number', event.target.value)
          }
          error={errors.number}
          disabled={loading}
        />

        <Input
          label={t('players.form.yearsOnTeam')}
          type="number"
          min="0"
          value={values.years_on_team}
          onChange={(event) =>
            updateValue('years_on_team', event.target.value)
          }
          error={errors.years_on_team}
          disabled={loading}
        />

        <div className="player-form-field">
          <label htmlFor="player-team">
            {t('players.form.team')}
          </label>

          <select
            id="player-team"
            value={values.team_id}
            onChange={(event) =>
              updateValue('team_id', event.target.value)
            }
            disabled={loading}
            aria-invalid={Boolean(errors.team_id)}
          >
            <option value="">
              {t('players.form.selectTeam')}
            </option>

            {teams.map((team) => (
              <option key={team.team_id} value={team.team_id}>
                {team.name}
              </option>
            ))}
          </select>

          {errors.team_id && (
            <span className="player-form-error">
              {errors.team_id}
            </span>
          )}
        </div>

        <div className="player-form-field">
          <label htmlFor="player-position">
            {t('players.form.position')}
          </label>

          <select
            id="player-position"
            value={values.position}
            onChange={(event) =>
              updateValue('position', event.target.value)
            }
            disabled={loading}
            aria-invalid={Boolean(errors.position)}
          >
            <option value="">
              {t('players.form.selectPosition')}
            </option>

            {positions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>

          {errors.position && (
            <span className="player-form-error">
              {errors.position}
            </span>
          )}
        </div>

        {isPitcher ? (
          <>
            <Input
              label={t('players.form.inningsPitched')}
              type="number"
              min="0"
              step="0.01"
              value={values.innings_pitched}
              onChange={(event) =>
                updateValue(
                  'innings_pitched',
                  event.target.value,
                )
              }
              error={errors.innings_pitched}
              disabled={loading}
            />

            <Input
              label={t('players.form.runsAllowed')}
              type="number"
              min="0"
              value={values.runs_allowed}
              onChange={(event) =>
                updateValue(
                  'runs_allowed',
                  event.target.value,
                )
              }
              error={errors.runs_allowed}
              disabled={loading}
            />
          </>
        ) : (
          <>
            <Input
              label={t('players.form.atBats')}
              type="number"
              min="0"
              value={values.at_bats}
              onChange={(event) =>
                updateValue('at_bats', event.target.value)
              }
              error={errors.at_bats}
              disabled={loading}
            />

            <Input
              label={t('players.form.hits')}
              type="number"
              min="0"
              value={values.hits}
              onChange={(event) =>
                updateValue('hits', event.target.value)
              }
              error={errors.hits}
              disabled={loading}
            />
          </>
        )}

        <Input
          label={t('players.form.battingAverage')}
          type="number"
          min="0"
          max="1"
          step="0.001"
          value={values.batting_average}
          onChange={(event) =>
            updateValue('batting_average', event.target.value)
          }
          error={errors.batting_average}
          disabled={loading}
        />
      </div>

      {serverError && (
        <div className="player-form-server-error" role="alert">
          {serverError}
        </div>
      )}

      <div className="player-form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          {t('players.form.cancel')}
        </Button>

        <Button type="submit" loading={loading}>
          {t('players.form.save')}
        </Button>
      </div>
    </form>
  );
}
