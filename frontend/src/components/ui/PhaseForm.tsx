import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Input } from './Input';
import './PhaseForm.css';

export interface PhaseFormData {
  name: string;
  start_date: string;
  end_date: string;
}

interface PhaseFormProps {
  initialData?: PhaseFormData;
  loading?: boolean;
  error?: string | null;
  onSubmit: (data: PhaseFormData) => void;
  onCancel: () => void;
}

export function PhaseForm({
  initialData,
  loading = false,
  error,
  onSubmit,
  onCancel,
}: PhaseFormProps) {
  const { t } = useTranslation();

  const [name, setName] = useState(
    initialData?.name ?? '',
  );
  const [startDate, setStartDate] = useState(
    initialData?.start_date ?? '',
  );
  const [endDate, setEndDate] = useState(
    initialData?.end_date ?? '',
  );
  const [errors, setErrors] = useState<{
    name?: string;
    start_date?: string;
    end_date?: string;
  }>({});

  function validate() {
    const nextErrors: typeof errors = {};

    if (!name.trim()) {
      nextErrors.name = t('phases.validation.nameRequired');
    }

    if (!startDate) {
      nextErrors.start_date = t(
        'phases.validation.startDateRequired',
      );
    }

    if (!endDate) {
      nextErrors.end_date = t(
        'phases.validation.endDateRequired',
      );
    }

    if (startDate && endDate && endDate < startDate) {
      nextErrors.end_date = t(
        'phases.validation.endDateBeforeStart',
      );
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit({
      name: name.trim(),
      start_date: startDate,
      end_date: endDate,
    });
  }

  return (
    <form
      className="phase-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <Input
        label={t('phases.name')}
        value={name}
        onChange={(event) =>
          setName(event.target.value)
        }
        error={errors.name}
        disabled={loading}
        autoFocus
      />

      <div className="phase-form-dates">
        <Input
          type="date"
          label={t('phases.startDate')}
          value={startDate}
          onChange={(event) =>
            setStartDate(event.target.value)
          }
          error={errors.start_date}
          disabled={loading}
        />

        <Input
          type="date"
          label={t('phases.endDate')}
          value={endDate}
          onChange={(event) =>
            setEndDate(event.target.value)
          }
          error={errors.end_date}
          disabled={loading}
        />
      </div>

      {error && (
        <p className="phase-form-error" role="alert">
          {error}
        </p>
      )}

      <div className="phase-form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          {t('common.cancel')}
        </Button>

        <Button type="submit" disabled={loading}>
          {loading
            ? t('common.loading')
            : t('common.save')}
        </Button>
      </div>
    </form>
  );
}
