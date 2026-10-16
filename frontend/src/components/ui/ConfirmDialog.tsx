import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Modal } from './Modal';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  loading?: boolean;
};

export function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel,
  loading = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      closeOnOverlayClick={!loading}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel ?? t('common.cancel')}
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={() => void onConfirm()}
            loading={loading}
          >
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </>
      }
    />
  );
}