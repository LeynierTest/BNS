import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pencil,
  Trash2,
} from 'lucide-react';

import {
  createStadium,
  deleteStadium,
  getStadiums,
  searchStadiums,
  updateStadium,
  type StadiumFormData,
  type StadiumSearchFilters,
} from '../api/stadiums';
import type { Stadium } from '../types/stadium';
import { useAuth } from '../auth/use-auth';

import DataTable, {
  type DataTableColumn,
} from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { IconButton } from '../components/ui/IconButton';
import { Input } from '../components/ui/Input';
import { LoadingState } from '../components/ui/LoadingState';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import StadiumForm from '../components/ui/StadiumForm';

import { getApiErrorMessage } from '../api/api-error';

import './StadiumsPage.css';
import { connectStadiumsEvents } from '../api/stadiums-events';

export default function StadiumsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const isAdministrator =
    user?.role === 'Administrator';

  const [stadiums, setStadiums] = useState<Stadium[]>(
    [],
  );

  const [nameFilter, setNameFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  // Filtros de la última búsqueda (null = lista completa): toda recarga
  // (eventos, tras guardar o borrar, reintentar) repite esa misma consulta.
  const [appliedFilters, setAppliedFilters] =
    useState<StadiumSearchFilters | null>(null);
  const hasSearched = appliedFilters !== null;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<
    string | null
  >(null);
  const [reloadCount, setReloadCount] =
    useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStadium, setEditingStadium] =
    useState<Stadium | null>(null);

  const [formLoading, setFormLoading] =
    useState(false);
  const [formError, setFormError] =
    useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<Stadium | null>(null);

  const [deleteLoading, setDeleteLoading] =
    useState(false);
  const [deleteError, setDeleteError] =
    useState<string | null>(null);

  useEffect(() => {
    // Descarta la respuesta si otra recarga la reemplazó o la página se desmontó.
    let ignore = false;

    async function loadStadiums() {
      try {
        const data = appliedFilters
          ? await searchStadiums(appliedFilters)
          : await getStadiums();

        if (ignore) {
          return;
        }

        setStadiums(data);
        setLoadError(null);
      } catch (error) {
        if (!ignore) {
          setLoadError(
            getApiErrorMessage(
              error,
              t('stadiums.loadError'),
            ),
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          setIsSearching(false);
        }
      }
    }

    void loadStadiums();

    return () => {
      ignore = true;
    };
  }, [appliedFilters, reloadCount, t]);

  useEffect(() => {
    const disconnect = connectStadiumsEvents({
      onEvent: () => {
        setReloadCount((count) => count + 1);
      },
    });

    return disconnect;
  }, []);

  function reloadStadiums() {
    setReloadCount((count) => count + 1);
  }

  function retryLoad() {
    setLoading(true);
    setLoadError(null);
    reloadStadiums();
  }

  const hasActiveFilters =
    nameFilter.trim() !== '' ||
    provinceFilter.trim() !== '' ||
    capacityFilter.trim() !== '';

  function handleSearch() {
    const normalizedCapacity = capacityFilter.trim();

    setIsSearching(true);
    setAppliedFilters({
      name: nameFilter.trim() || undefined,
      province: provinceFilter.trim() || undefined,
      capacity:
        normalizedCapacity !== ''
          ? Number(normalizedCapacity)
          : undefined,
    });
  }

  function clearFilters() {
    setNameFilter('');
    setProvinceFilter('');
    setCapacityFilter('');
    setAppliedFilters(null);
  }

  function openCreateModal() {
    setEditingStadium(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(stadium: Stadium) {
    setEditingStadium(stadium);
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (formLoading) {
      return;
    }

    setModalOpen(false);
    setEditingStadium(null);
    setFormError(null);
  }

  async function handleSubmit(
    data: StadiumFormData,
  ) {
    setFormLoading(true);
    setFormError(null);

    try {
      if (editingStadium) {
        await updateStadium(
          editingStadium.stadium_id,
          data,
        );
      } else {
        await createStadium(data);
      }

      closeModal();
      reloadStadiums();
    } catch (error) {
      setFormError(
        getApiErrorMessage(
          error,
          t('stadiums.saveError'),
        ),
      );
    } finally {
      setFormLoading(false);
    }
  }

  function openDeleteDialog(stadium: Stadium) {
    setDeleteError(null);
    setDeleteTarget(stadium);
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
      await deleteStadium(
        deleteTarget.stadium_id,
      );

      closeDeleteDialog();
      reloadStadiums();
    } catch (error) {
      setDeleteError(
        getApiErrorMessage(
          error,
          t('stadiums.deleteError'),
        ),
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns = useMemo<
    DataTableColumn<Stadium>[]
  >(() => {
    const baseColumns: DataTableColumn<Stadium>[] =
      [
        {
          key: 'name',
          header: t('stadiums.name'),
          render: (stadium) => (
            <span className="stadiums-name">
              {stadium.name}
            </span>
          ),
        },
        {
          key: 'province',
          header: t('stadiums.province'),
          render: (stadium) => (
            <span className="stadiums-province">
              {stadium.province}
            </span>
          ),
        },
        {
          key: 'capacity',
          header: t('stadiums.capacity'),
          render: (stadium) => (
            <span className="stadiums-capacity">
              {stadium.capacity.toLocaleString()}
            </span>
          ),
        },
      ];

    if (isAdministrator) {
      baseColumns.push({
        key: 'actions',
        header: '',
        render: (stadium) => (
          <div className="stadiums-actions">
            <IconButton
              label={t('stadiums.edit')}
              onClick={() =>
                openEditModal(stadium)
              }
            >
              <Pencil
                size={16}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </IconButton>

            <IconButton
              label={t('stadiums.delete')}
              variant="danger"
              onClick={() =>
                openDeleteDialog(stadium)
              }
            >
              <Trash2
                size={16}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </IconButton>
          </div>
        ),
      });
    }

    return baseColumns;
  }, [isAdministrator, t]);

  const formInitialValues: StadiumFormData | undefined =
    editingStadium
      ? {
          name: editingStadium.name,
          capacity: editingStadium.capacity,
          province: editingStadium.province,
        }
      : undefined;

  return (
    <section className="stadiums-page">
      <PageHeader
        title={t('stadiums.title')}
        description={t('stadiums.description')}
        actions={
          isAdministrator ? (
            <Button type="button" onClick={openCreateModal}>
              {t('stadiums.newStadium')}
            </Button>
          ) : undefined
        }
      />

      {!loading && (!loadError || hasSearched) && (
        <div className="stadiums-toolbar">
          <div className="stadiums-filters">
            <Input
              label={t('stadiums.filters.name')}
              placeholder={t(
                'stadiums.filters.namePlaceholder',
              )}
              value={nameFilter}
              onChange={(event) =>
                setNameFilter(event.target.value)
              }
            />

            <Input
              label={t('stadiums.filters.province')}
              placeholder={t(
                'stadiums.filters.provincePlaceholder',
              )}
              value={provinceFilter}
              onChange={(event) =>
                setProvinceFilter(event.target.value)
              }
            />

            <Input
              type="number"
              label={t('stadiums.filters.capacity')}
              placeholder={t(
                'stadiums.filters.capacityPlaceholder',
              )}
              value={capacityFilter}
              onChange={(event) =>
                setCapacityFilter(event.target.value)
              }
            />
          </div>

          <div className="stadiums-toolbar-footer">
            <Button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching
                ? t('common.loading')
                : t('stadiums.search')}
            </Button>

            <span className="stadiums-count">
              {stadiums.length}
            </span>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="secondary"
                onClick={clearFilters}
                disabled={isSearching}
              >
                {t('stadiums.clearFilters')}
              </Button>
            )}
          </div>
        </div>
      )}

      {loading && <LoadingState />}

      {!loading && loadError && (
        <div className="stadiums-error">
          <ErrorMessage message={loadError} />

          <Button
            variant="secondary"
            onClick={retryLoad}
          >
            {t('common.retry')}
          </Button>
        </div>
      )}

      {!loading &&
        !loadError &&
        stadiums.length === 0 && (
          <EmptyState
            title={
              hasSearched
                ? t('stadiums.emptySearch')
                : t('stadiums.emptyTitle')
            }
            description={
              hasSearched
                ? undefined
                : t('stadiums.emptyDescription')
            }
          />
        )}

      {!loading &&
        !loadError &&
        stadiums.length > 0 && (
          <DataTable
            columns={columns}
            data={stadiums}
            getRowKey={(stadium) =>
              stadium.stadium_id
            }
          />
        )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={
          editingStadium
            ? t('stadiums.editTitle')
            : t('stadiums.newStadium')
        }
        description={
          editingStadium
            ? t('stadiums.editDescription')
            : t('stadiums.createDescription')
        }
      >
        <StadiumForm
          key={editingStadium?.stadium_id ?? 'create-stadium-form'}
          initialValues={formInitialValues}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          loading={formLoading}
          serverError={formError}
        />
      </Modal>

      {deleteError && (
        <div className="stadiums-delete-error">
          <ErrorMessage message={deleteError} />
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('stadiums.deleteTitle')}
        description={
          deleteError
            ? `${t('stadiums.deleteDescription')} ${deleteError}`
            : t('stadiums.deleteDescription')
        }
        confirmLabel={t('stadiums.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => void handleDelete()}
        onCancel={closeDeleteDialog}
        loading={deleteLoading}
      />
    </section>
  );
}
