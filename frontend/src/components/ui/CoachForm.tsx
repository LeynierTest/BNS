import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from './Button';
import './CoachForm.css';
import { Input } from './Input';
import { Select } from './Select';

import type { CoachFormData } from '../../types/coach';

export interface CoachTeamOption {
  team_id: number;
  name: string;
}

interface CoachFormProps {
  initialData?: CoachFormData;
  teams: CoachTeamOption[];
  loading?: boolean;
  error?: string | null;
  onSubmit: (data: CoachFormData) => void | Promise<void>;
  onCancel: () => void;
}

export function CoachForm({
  initialData,
  teams,
  loading = false,
  error,
  onSubmit,
  onCancel,
}: CoachFormProps) {
  const { t } = useTranslation();

  const [name, setName] = useState(
    initialData?.name ?? '',
  );
  const [number, setNumber] = useState(
    initialData?.number?.toString() ?? '',
  );
  const [yearsOnTeam, setYearsOnTeam] = useState(
    initialData?.years_on_team?.toString() ?? '0',
  );
  const [teamId, setTeamId] = useState(
    initialData?.team_id?.toString() ?? '',
  );
  const [yearsExperience, setYearsExperience] = useState(
    initialData?.years_experience?.toString() ?? '0',
  );

  const [validationError, setValidationError] =
    useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedName = name.trim();
    const parsedNumber = Number(number);
    const parsedYearsOnTeam = Number(yearsOnTeam);
    const parsedTeamId = Number(teamId);
    const parsedYearsExperience =
      Number(yearsExperience);

    if (!trimmedName) {
      setValidationError(
        t('coaches.validation.nameRequired'),
      );
      return;
    }

    if (
      !Number.isInteger(parsedNumber) ||
      parsedNumber <= 0
    ) {
      setValidationError(
        t('coaches.validation.numberInvalid'),
      );
      return;
    }

    if (
      !Number.isInteger(parsedYearsOnTeam) ||
      parsedYearsOnTeam < 0
    ) {
      setValidationError(
        t('coaches.validation.yearsOnTeamInvalid'),
      );
      return;
    }

    if (!Number.isInteger(parsedTeamId) || parsedTeamId <= 0) {
      setValidationError(
        t('coaches.validation.teamRequired'),
      );
      return;
    }

    if (
      !Number.isInteger(parsedYearsExperience) ||
      parsedYearsExperience < 0
    ) {
      setValidationError(
        t('coaches.validation.yearsExperienceInvalid'),
      );
      return;
    }

    setValidationError(null);

    await onSubmit({
      name: trimmedName,
      number: parsedNumber,
      years_on_team: parsedYearsOnTeam,
      team_id: parsedTeamId,
      years_experience: parsedYearsExperience,
    });
  }

  return (
    <form
      className="coach-form"
      onSubmit={handleSubmit}
    >
      <div className="coach-form-grid">
        <Input
          label={t('coaches.name')}
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          disabled={loading}
          autoFocus
        />

        <Input
          label={t('coaches.number')}
          type="number"
          min="1"
          value={number}
          onChange={(event) =>
            setNumber(event.target.value)
          }
          disabled={loading}
        />

        <Input
          label={t('coaches.yearsOnTeam')}
          type="number"
          min="0"
          value={yearsOnTeam}
          onChange={(event) =>
            setYearsOnTeam(event.target.value)
          }
          disabled={loading}
        />

        <Select
          label={t('coaches.team')}
          value={teamId}
          onChange={(event) =>
            setTeamId(event.target.value)
          }
          disabled={loading}
          options={[
            {
              value: '',
              label: t('coaches.selectTeam'),
            },
            ...teams.map((team) => ({
              value: String(team.team_id),
              label: team.name,
            })),
          ]}
        />

        <Input
          label={t('coaches.yearsExperience')}
          type="number"
          min="0"
          value={yearsExperience}
          onChange={(event) =>
            setYearsExperience(event.target.value)
          }
          disabled={loading}
        />
      </div>

      {(validationError || error) && (
        <p className="coach-form-error" role="alert">
          {validationError ?? error}
        </p>
      )}

      <div className="coach-form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          {t('common.cancel')}
        </Button>

        <Button
          type="submit"
          loading={loading}
          disabled={loading}
        >
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
