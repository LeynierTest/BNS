import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Input } from './Input';
import type { StadiumFormData } from '../../api/stadiums';
import './StadiumForm.css';

interface StadiumFormProps {
  initialValues?: StadiumFormData;
  onSubmit: (data: StadiumFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  serverError?: string | null;
}

interface StadiumFormErrors {
  name?: string;
  capacity?: string;
  province?: string;
}

const EMPTY_VALUES: StadiumFormData = {
  name: '',
  capacity: 0,
  province: '',
};

export default function StadiumForm({
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
  serverError = null,
}: StadiumFormProps) {
  const { t } = useTranslation();

  const [values, setValues] =
    useState<StadiumFormData>(
      initialValues ?? EMPTY_VALUES,
    );

  const [errors, setErrors] =
    useState<StadiumFormErrors>({});

  useEffect(() => {
    setValues(initialValues ?? EMPTY_VALUES);
    setErrors({});
  }, [initialValues]);

  function updateField<K extends keyof StadiumFormData>(
    field: K,
    value: StadiumFormData[K],
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

  function validate(): StadiumFormErrors {
    const nextErrors: StadiumFormErrors = {};

    if (!values.name.trim()) {
      nextErrors.name = t(
        'stadiums.form.validation.required',
      );
    }

    if (
      !Number.isInteger(values.capacity) ||
      values.capacity <= 0
    ) {
      nextErrors.capacity = t(
        'stadiums.form.validation.positiveInteger',
      );
    }

    if (!values.province.trim()) {
      nextErrors.province = t(
        'stadiums.form.validation.required',
      );
    }

    return nextErrors;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    await onSubmit({
      name: values.name.trim(),
      capacity: values.capacity,
      province: values.province.trim(),
    });
  }

  return (
    <form
      className="stadium-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="stadium-form-grid">
        <Input
          label={t('stadiums.form.name')}
          value={values.name}
          onChange={(event) =>
            updateField('name', event.target.value)
          }
          error={errors.name}
          disabled={loading}
          autoFocus
        />

        <Input
          label={t('stadiums.form.capacity')}
          type="number"
          min={1}
          step={1}
          value={
            values.capacity === 0
              ? ''
              : values.capacity
          }
          onChange={(event) =>
            updateField(
              'capacity',
              event.target.value === ''
                ? 0
                : Number(event.target.value),
            )
          }
          error={errors.capacity}
          disabled={loading}
        />

        <Input
          label={t('stadiums.form.province')}
          value={values.province}
          onChange={(event) =>
            updateField(
              'province',
              event.target.value,
            )
          }
          error={errors.province}
          disabled={loading}
        />
      </div>

      {serverError && (
        <p
          className="stadium-form-server-error"
          role="alert"
        >
          {serverError}
        </p>
      )}

      <div className="stadium-form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          {t('stadiums.form.cancel')}
        </Button>

        <Button
          type="submit"
          disabled={loading}
        >
          {loading
            ? t('common.loading')
            : t('stadiums.form.save')}
        </Button>
      </div>
    </form>
  );
}
