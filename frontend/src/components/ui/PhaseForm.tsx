import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SERIES_PHASE_NAMES,
  getPhaseOrder,
} from '../../types/phase';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import './PhaseForm.css';

export interface PhaseFormData {
  name: string;
  start_date: string;
  end_date: string;
}

interface PhaseFormProps {
  initialData?: PhaseFormData;
  /** Las demás fases registradas, para validar nombre único y orden. */
  otherPhases?: PhaseFormData[];
  loading?: boolean;
  error?: string | null;
  onSubmit: (data: PhaseFormData) => void;
  onCancel: () => void;
}

export function PhaseForm({
  initialData,
  otherPhases = [],
  loading = false,
  error,
  onSubmit,
  onCancel,
}: PhaseFormProps) {
  const { t } = useTranslation();

  // Un nombre antiguo que no es de la Serie no se puede conservar: el
  // backend solo admite los de SERIES_PHASE_NAMES.
  const legacyName =
    initialData && getPhaseOrder(initialData.name) === -1
      ? initialData.name
      : null;
  const [name, setName] = useState(
    legacyName === null ? (initialData?.name ?? '') : '',
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

    if (otherPhases.some((phase) => phase.name === name)) {
      nextErrors.name = t('phases.validation.nameTaken', {
        phase: name,
      });
    }

    // Cada fase empieza después de que termine la anterior y termina antes
    // de que empiece la siguiente (las fechas YYYY-MM-DD se comparan como texto).
    const order = getPhaseOrder(name);

    for (const other of otherPhases) {
      const otherOrder = getPhaseOrder(other.name);

      if (order === -1 || otherOrder === -1) {
        continue;
      }

      if (
        startDate &&
        otherOrder < order &&
        other.end_date >= startDate
      ) {
        nextErrors.start_date ??= t('phases.validation.mustStartAfter', {
          phase: name,
          previous: other.name,
          date: other.end_date,
        });
      }

      if (
        endDate &&
        otherOrder > order &&
        other.start_date <= endDate
      ) {
        nextErrors.end_date ??= t('phases.validation.mustEndBefore', {
          phase: name,
          next: other.name,
          date: other.start_date,
        });
      }
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
      name,
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
      <Select
        label={t('phases.name')}
        value={name}
        onChange={(event) =>
          setName(event.target.value)
        }
        error={errors.name}
        hint={
          legacyName
            ? t('phases.legacyNameHint', { name: legacyName })
            : undefined
        }
        disabled={loading}
        autoFocus
        options={[
          { value: '', label: t('phases.selectName') },
          ...SERIES_PHASE_NAMES.map((phaseName) => ({
            value: phaseName,
            label: phaseName,
            disabled: otherPhases.some(
              (phase) => phase.name === phaseName,
            ),
          })),
        ]}
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
