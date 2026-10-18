import { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  createPhase,
  deletePhase,
  getPhases,
  searchPhases,
  updatePhase,
} from '../api/phases';
import { getApiErrorMessage } from '../api/api-error';
import { useAuth } from '../auth/use-auth';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import DataTable from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { IconButton } from '../components/ui/IconButton';
import { Input } from '../components/ui/Input';
import { LoadingState } from '../components/ui/LoadingState';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { PhaseForm } from '../components/ui/PhaseForm';

import type { Phase } from '../types/phase';

import './PhasesPage.css';
import { connectPhasesEvents } from '../api/phases-events';

type PhaseFormValues = {
  name: string;
  start_date: string;
  end_date: string;
};

function formatDate(value: string, locale: string) {
  if (!value) {
    return '—';
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export default function PhasesPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const isAdministrator = user?.role === 'Administrator';

  const [phases, setPhases] = useState<Phase[]>([]);
  const [allPhases, setAllPhases] = useState<Phase[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Phase | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    // Descarta la respuesta si otra recarga la reemplazó o la página se desmontó.
    let ignore = false;

    async function loadPhases() {
      try {
        const data = await getPhases();

        if (ignore) {
          return;
        }

        setPhases(data);
        setAllPhases(data);
        setLoadError(null);
      } catch (error) {
        if (!ignore) {
          setLoadError(getApiErrorMessage(error, t('common.unknownError')));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadPhases();

    return () => {
      ignore = true;
    };
  }, [reloadCount, t]);

  useEffect(() => {
    const disconnect = connectPhasesEvents({
      onEvent: () => {
        setReloadCount((count) => count + 1);
      },
    });

    return disconnect;
  }, []);

  function reloadPhases() {
    setReloadCount((count) => count + 1);
  }

  function retryLoad() {
    setLoading(true);
    setLoadError(null);
    reloadPhases();
  }

  const hasActiveFilters =
    nameFilter.trim() !== '' ||
    dateFilter !== '';

  async function handleSearch() {
    try {
      setIsSearching(true);
      setLoadError(null);

      const data = await searchPhases({
        name: nameFilter.trim() || undefined,
        active_date: dateFilter || undefined,
      });

      setPhases(data);
      setHasSearched(true);
    } catch (error) {
      setLoadError(
        getApiErrorMessage(
          error,
          t('common.unknownError'),
        ),
      );
    } finally {
      setIsSearching(false);
    }
  }

  function clearFilters() {
    setNameFilter('');
    setDateFilter('');
    setHasSearched(false);
    setPhases(allPhases);
  }

  function openCreateModal() {
    setEditingPhase(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(phase: Phase) {
    setEditingPhase(phase);
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (formLoading) {
      return;
    }

    setModalOpen(false);
    setEditingPhase(null);
    setFormError(null);
  }

  async function handleSubmit(data: PhaseFormValues) {
    setFormLoading(true);
    setFormError(null);

    try {
      if (editingPhase) {
        await updatePhase(editingPhase.phase_id, data);
      } else {
        await createPhase(data);
      }

      closeModal();
      reloadPhases();
    } catch (error) {
      setFormError(getApiErrorMessage(error, t('common.unknownError')));
    } finally {
      setFormLoading(false);
    }
  }

  function openDeleteDialog(phase: Phase) {
    setDeleteTarget(phase);
    setDeleteError(null);
  }

  function closeDeleteDialog() {
    if (deleteLoading) {
      return;
    }

    setDeleteTarget(null);
    setDeleteError(null);
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await deletePhase(deleteTarget.phase_id);
      closeDeleteDialog();
      reloadPhases();
    } catch (error) {
      setDeleteError(getApiErrorMessage(error, t('common.unknownError')));
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: t('phases.name'),
        render: (phase: Phase) => (
          <span className="phases-name">{phase.name}</span>
        ),
      },
      {
        key: 'start_date',
        header: t('phases.startDate'),
        render: (phase: Phase) => (
          <span className="phases-date">
            {formatDate(phase.start_date, i18n.language)}
          </span>
        ),
      },
      {
        key: 'end_date',
        header: t('phases.endDate'),
        render: (phase: Phase) => (
          <span className="phases-date">
            {formatDate(phase.end_date, i18n.language)}
          </span>
        ),
      },
      ...(isAdministrator
        ? [{
            key: 'actions',
            header: '',
            render: (phase: Phase) => (
            <div className="phases-actions">
              <IconButton
                label={`${t('common.edit')} ${phase.name}`}
                onClick={() => openEditModal(phase)}
              >
                <Pencil size={17} strokeWidth={1.9} />
              </IconButton>

              <IconButton
                label={`${t('common.delete')} ${phase.name}`}
                variant="danger"
                onClick={() => openDeleteDialog(phase)}
              >
                <Trash2 size={17} strokeWidth={1.9} />
              </IconButton>
            </div>
            ),
          }]
        : []),
    ],
    [i18n.language, isAdministrator, t],
  );

  return (
    <section className="phases-page">
      <PageHeader
        eyebrow={t('phases.eyebrow')}
        title={t('phases.title')}
        description={t('phases.description')}
        actions={
          isAdministrator ? (
            <Button type="button" onClick={openCreateModal}>
              {t('phases.newPhase')}
            </Button>
          ) : (
            <Badge variant="neutral">
              {t('phases.viewOnly')}
            </Badge>
          )
        }
      />

      {!loading && !loadError && (
        <div className="phases-toolbar">
          <div className="phases-filters">
            <Input
              label={t('phases.filters.name')}
              placeholder={t(
                'phases.filters.namePlaceholder',
              )}
              value={nameFilter}
              onChange={(event) =>
                setNameFilter(event.target.value)
              }
            />

            <Input
              type="date"
              label={t('phases.filters.date')}
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(event.target.value)
              }
            />
          </div>

          <div className="phases-toolbar-footer">
            <Button
              type="button"
              onClick={() => void handleSearch()}
              disabled={isSearching}
            >
              {isSearching
                ? t('common.loading')
                : t('phases.search')}
            </Button>

            <span className="phases-count">
              {phases.length}
            </span>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="secondary"
                onClick={clearFilters}
                disabled={isSearching}
              >
                {t('phases.clearFilters')}
              </Button>
            )}
          </div>
        </div>
      )}

      {loading && <LoadingState message={t('common.loading')} />}

      {!loading && loadError && (
        <div className="phases-error">
          <ErrorMessage message={loadError} />
          <Button
            type="button"
            variant="secondary"
            onClick={retryLoad}
          >
            {t('common.retry')}
          </Button>
        </div>
      )}

      {!loading && !loadError && phases.length === 0 && (
        <EmptyState
          title={
            hasSearched
              ? t('phases.noResults')
              : t('phases.emptyTitle')
          }
          description={
            hasSearched
              ? t('phases.noResultsDescription')
              : t('phases.emptyDescription')
          }
        />
      )}

      {!loading && !loadError && phases.length > 0 && (
        <DataTable
          columns={columns}
          data={phases}
          getRowKey={(phase: Phase) => phase.phase_id}
        />
      )}

      <Modal
        open={modalOpen}
        title={
          editingPhase
            ? t('phases.editTitle')
            : t('phases.createTitle')
        }
        onClose={closeModal}
      >
        <PhaseForm
          key={editingPhase?.phase_id ?? 'create-phase-form'}
          initialData={
            editingPhase
              ? {
                  name: editingPhase.name,
                  start_date: editingPhase.start_date,
                  end_date: editingPhase.end_date,
                }
              : undefined
          }
          loading={formLoading}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('phases.deleteTitle')}
        description={
          deleteError
            ? `${t('phases.deleteDescription')} ${deleteError}`
            : t('phases.deleteDescription')
        }
        confirmLabel={t('phases.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => void handleDelete()}
        onCancel={closeDeleteDialog}
        loading={deleteLoading}
      />
    </section>
  );
}
