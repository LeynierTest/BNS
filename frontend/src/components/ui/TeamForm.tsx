import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  FormEvent,
  ReactNode,
} from 'react';
import { Button } from './Button';
import { Input } from './Input';
import type { TeamFormData } from '../../types/team';
import './TeamForm.css';

type TeamFormProps = {
  initialValues?: Partial<TeamFormData>;
  onSubmit: (
    data: TeamFormData,
  ) => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
  serverError?: ReactNode;
};

type FormValues = {
  name: string;
  province: string;
  championships_participated: string;
  championships_won: string;
  mascot: string;
  color: string;
};

type FormErrors = Partial<
  Record<keyof FormValues, string>
>;

export function TeamForm({
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
  serverError,
}: TeamFormProps) {
  const { t } = useTranslation();

  const [values, setValues] = useState<FormValues>({
    name: initialValues?.name ?? '',
    province: initialValues?.province ?? '',
    championships_participated:
      initialValues?.championships_participated
        ?.toString() ?? '',
    championships_won:
      initialValues?.championships_won
        ?.toString() ?? '',
    mascot: initialValues?.mascot ?? '',
    color: initialValues?.color ?? '',
  });

  const [errors, setErrors] =
    useState<FormErrors>({});

  function updateField(
    field: keyof FormValues,
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {};

    if (!values.name.trim()) {
      nextErrors.name = t(
        'teams.form.validation.required',
      );
    }

    if (!values.province.trim()) {
      nextErrors.province = t(
        'teams.form.validation.required',
      );
    }

    if (!values.mascot.trim()) {
      nextErrors.mascot = t(
        'teams.form.validation.required',
      );
    }

    if (!values.color.trim()) {
      nextErrors.color = t(
        'teams.form.validation.required',
      );
    }

    const participated =
      Number(values.championships_participated);

    if (
      values.championships_participated.trim() === ''
    ) {
      nextErrors.championships_participated =
        t(
          'teams.form.validation.required',
        );
    } else if (
      !Number.isInteger(participated) ||
      participated < 0
    ) {
      nextErrors.championships_participated =
        t(
          'teams.form.validation.nonNegativeInteger',
        );
    }

    const won = Number(
      values.championships_won,
    );

    if (
      values.championships_won.trim() === ''
    ) {
      nextErrors.championships_won = t(
        'teams.form.validation.required',
      );
    } else if (
      !Number.isInteger(won) ||
      won < 0
    ) {
      nextErrors.championships_won = t(
        'teams.form.validation.nonNegativeInteger',
      );
    }

    if (
      Number.isInteger(won) &&
      Number.isInteger(participated) &&
      won >= 0 &&
      participated >= 0 &&
      won > participated
    ) {
      nextErrors.championships_won = t(
        'teams.form.validation.wonExceedsParticipated',
      );
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    await onSubmit({
      name: values.name.trim(),
      province: values.province.trim(),
      championships_participated: Number(
        values.championships_participated,
      ),
      championships_won: Number(
        values.championships_won,
      ),
      mascot: values.mascot.trim(),
      color: values.color.trim(),
    });
  }

  return (
    <form
      className="team-form"
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
    >
      <div className="team-form-grid">
        <Input
          label={t('teams.form.name')}
          maxLength={100}
          value={values.name}
          onChange={(event) =>
            updateField(
              'name',
              event.target.value,
            )
          }
          error={errors.name}
          required
          disabled={loading}
          autoComplete="off"
        />

        <Input
          label={t('teams.form.province')}
          maxLength={100}
          value={values.province}
          onChange={(event) =>
            updateField(
              'province',
              event.target.value,
            )
          }
          error={errors.province}
          required
          disabled={loading}
          autoComplete="address-level1"
        />

        <Input
          label={t(
            'teams.form.championshipsParticipated',
          )}
          type="number"
          min="0"
          step="1"
          value={
            values.championships_participated
          }
          onChange={(event) =>
            updateField(
              'championships_participated',
              event.target.value,
            )
          }
          error={
            errors.championships_participated
          }
          required
          disabled={loading}
          inputMode="numeric"
        />

        <Input
          label={t(
            'teams.form.championshipsWon',
          )}
          type="number"
          min="0"
          step="1"
          value={values.championships_won}
          onChange={(event) =>
            updateField(
              'championships_won',
              event.target.value,
            )
          }
          error={errors.championships_won}
          required
          disabled={loading}
          inputMode="numeric"
        />

        <Input
          label={t('teams.form.mascot')}
          maxLength={100}
          value={values.mascot}
          onChange={(event) =>
            updateField(
              'mascot',
              event.target.value,
            )
          }
          error={errors.mascot}
          required
          disabled={loading}
          autoComplete="off"
        />

        <Input
          label={t('teams.form.color')}
          maxLength={50}
          value={values.color}
          onChange={(event) =>
            updateField(
              'color',
              event.target.value,
            )
          }
          error={errors.color}
          required
          disabled={loading}
          autoComplete="off"
        />
      </div>

      {serverError && (
        <div className="team-form-server-error">
          {serverError}
        </div>
      )}

      <div className="team-form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          {t('teams.form.cancel')}
        </Button>

        <Button
          type="submit"
          loading={loading}
        >
          {t('teams.form.save')}
        </Button>
      </div>
    </form>
  );
}