import {
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './Modal.css';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  closeOnOverlayClick?: boolean;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  description,
  footer,
  closeOnOverlayClick = true,
}: ModalProps) {
  const closeButtonRef =
    useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    closeButtonRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  function handleOverlayMouseDown(
    event: React.MouseEvent<HTMLDivElement>,
  ) {
    if (
      closeOnOverlayClick &&
      event.target === event.currentTarget
    ) {
      onClose();
    }
  }

  return createPortal(
    <div
      className="ui-modal-overlay"
      onMouseDown={handleOverlayMouseDown}
    >
      <section
        className="ui-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ui-modal-title"
        aria-describedby={
          description
            ? 'ui-modal-description'
            : undefined
        }
      >
        <header className="ui-modal-header">
          <div className="ui-modal-heading">
            <h2 id="ui-modal-title">
              {title}
            </h2>

            {description && (
              <p id="ui-modal-description">
                {description}
              </p>
            )}
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="ui-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X
              size={18}
              strokeWidth={1.9}
              aria-hidden="true"
            />
          </button>
        </header>

        <div className="ui-modal-body">
          {children}
        </div>

        {footer && (
          <footer className="ui-modal-footer">
            {footer}
          </footer>
        )}
      </section>
    </div>,
    document.body,
  );
}