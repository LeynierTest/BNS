import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  createCoach,
  deleteCoach,
  getCoaches,
  searchCoaches,
  updateCoach,
} from '../api/coaches';
import { getTeams } from '../api/teams';
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
import { CoachForm } from '../components/ui/CoachForm';

import type {
  Coach,
  CoachFormData,
} from '../types/coach';
import type { Team } from '../types/team';

import './CoachesPage.css';
import { connectCoachesEvents } from '../api/coaches-events';

export default function CoachesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const isAdministrator =
    user?.role === 'Administrator';

  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [nameFilter, setNameFilter] = useState('');
  const [numberFilter, setNumberFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [yearsOnTeamFilter, setYearsOnTeamFilter] = useState('');
  const [yearsExperienceFilter, setYearsExperienceFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] =
    useState<string | null>(null);
  const [reloadCount, setReloadCount] =
    useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] =
    useState<Coach | null>(null);

  const [formLoading, setFormLoading] =
    useState(false);
  const [formError, setFormError] =
    useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<Coach | null>(null);
  const [deleteLoading, setDeleteLoading] =
    useState(false);
  const [deleteError, setDeleteError] =
    useState<string | null>(null);

  useEffect(() => {
    // Descarta la respuesta si otra recarga la reemplazó o la página se desmontó.
    let ignore = false;

    async function loadData() {
      try {
        const [coachesData, teamsData] =
          await Promise.all([
            getCoaches(),
            getTeams(),
          ]);

        if (ignore) {
          return;
        }

        setCoaches(coachesData);
        setTeams(teamsData);
        setLoadError(null);
      } catch (error) {
        if (!ignore) {
          setLoadError(
            getApiErrorMessage(
              error,
              t('coaches.loadError'),
            ),
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, [reloadCount, t]);

  useEffect(() => {
    const disconnect = connectCoachesEvents({
      onEvent: () => {
        setReloadCount((count) => count + 1);
      },
    });

    return disconnect;
  }, []);

  function reloadCoaches() {
    setReloadCount((count) => count + 1);
  }

  function retryLoad() {
    setLoading(true);
    setLoadError(null);
    reloadCoaches();
  }

  const hasActiveFilters =
    nameFilter.trim() !== '' ||
    numberFilter.trim() !== '' ||
    teamFilter.trim() !== '' ||
    yearsOnTeamFilter.trim() !== '' ||
    yearsExperienceFilter.trim() !== '';

  async function handleSearch() {
    setIsSearching(true);
    setLoadError(null);

    try {
      const data = await searchCoaches({
        ...(numberFilter.trim()
          ? { number: Number(numberFilter) }
          : {}),
        ...(nameFilter.trim()
          ? { name: nameFilter.trim() }
          : {}),
        ...(teamFilter.trim()
          ? { team: teamFilter.trim() }
          : {}),
        ...(yearsOnTeamFilter.trim()
          ? {
              years_on_team:
                Number(yearsOnTeamFilter),
            }
          : {}),
        ...(yearsExperienceFilter.trim()
          ? {
              years_experience:
                Number(yearsExperienceFilter),
            }
          : {}),
      });

      setCoaches(data);
      setHasSearched(true);
    } catch (error) {
      setLoadError(
        getApiErrorMessage(
          error,
          t('coaches.loadError'),
        ),
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function clearFilters() {
    setNameFilter('');
    setNumberFilter('');
    setTeamFilter('');
    setYearsOnTeamFilter('');
    setYearsExperienceFilter('');
    setLoadError(null);

    try {
      const data = await getCoaches();
      setCoaches(data);
      setHasSearched(false);
    } catch (error) {
      setLoadError(
        getApiErrorMessage(
          error,
          t('coaches.loadError'),
        ),
      );
    }
  }

  function openCreateModal() {
    setEditingCoach(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(coach: Coach) {
    setEditingCoach(coach);
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (formLoading) {
      return;
    }

    setModalOpen(false);
    setEditingCoach(null);
    setFormError(null);
  }

  async function handleSubmit(
    data: CoachFormData,
  ) {
    setFormLoading(true);
    setFormError(null);

    try {
      if (editingCoach) {
        await updateCoach(
          editingCoach.team_member_id,
          data,
        );
      } else {
        await createCoach(data);
      }

      closeModal();
      reloadCoaches();
    } catch (error) {
      setFormError(
        getApiErrorMessage(
          error,
          t('coaches.saveError'),
        ),
      );
    } finally {
      setFormLoading(false);
    }
  }

  function openDeleteDialog(coach: Coach) {
    setDeleteTarget(coach);
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
      await deleteCoach(
        deleteTarget.team_member_id,
      );

      closeDeleteDialog();
      reloadCoaches();
    } catch (error) {
      setDeleteError(
        getApiErrorMessage(
          error,
          t('coaches.deleteError'),
        ),
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: t('coaches.name'),
        render: (coach: Coach) => (
          <span className="coaches-name">
            {coach.name}
          </span>
        ),
      },
      {
        key: 'number',
        header: t('coaches.number'),
        render: (coach: Coach) => (
          <span className="coaches-number">
            #{coach.number}
          </span>
        ),
      },
      {
        key: 'team',
        header: t('coaches.team'),
        render: (coach: Coach) => (
          <span className="coaches-team">
            {coach.team_name || '—'}
          </span>
        ),
      },
      {
        key: 'years_on_team',
        header: t('coaches.yearsOnTeam'),
        render: (coach: Coach) =>
          coach.years_on_team,
      },
      {
        key: 'years_experience',
        header: t('coaches.yearsExperience'),
        render: (coach: Coach) =>
          coach.years_experience,
      },
      ...(isAdministrator
        ? [{
            key: 'actions',
            header: '',
            render: (coach: Coach) => (
            <div className="coaches-actions">
              <IconButton
                label={`${t('common.edit')} ${coach.name}`}
                onClick={() =>
                  openEditModal(coach)
                }
              >
                <Pencil
                  size={17}
                  strokeWidth={1.9}
                />
              </IconButton>

              <IconButton
                label={`${t('common.delete')} ${coach.name}`}
                variant="danger"
                onClick={() =>
                  openDeleteDialog(coach)
                }
              >
                <Trash2
                  size={17}
                  strokeWidth={1.9}
                />
              </IconButton>
            </div>
            ),
          }]
        : []),
    ],
    [isAdministrator, t],
  );

  return (
    <section className="coaches-page">
      <PageHeader
        eyebrow={t('coaches.eyebrow')}
        title={t('coaches.title')}
        description={t('coaches.description')}
        actions={
          isAdministrator ? (
            <Button
              type="button"
              onClick={openCreateModal}
            >
              {t('coaches.newCoach')}
            </Button>
          ) : (
            <Badge variant="neutral">
              {t('coaches.viewOnly')}
            </Badge>
          )
        }
      />

      {!loading && !loadError && (
        <div className="coaches-toolbar">
          <div className="coaches-filters">
            <Input
              label={t('coaches.filters.name')}
              placeholder={t(
                'coaches.filters.namePlaceholder',
              )}
              value={nameFilter}
              onChange={(event) =>
                setNameFilter(event.target.value)
              }
            />

            <Input
              type="number"
              label={t('coaches.filters.number')}
              placeholder={t(
                'coaches.filters.numberPlaceholder',
              )}
              value={numberFilter}
              onChange={(event) =>
                setNumberFilter(event.target.value)
              }
            />

            <Input
              label={t('coaches.filters.team')}
              placeholder={t(
                'coaches.filters.teamPlaceholder',
              )}
              value={teamFilter}
              onChange={(event) =>
                setTeamFilter(event.target.value)
              }
            />

            <Input
              type="number"
              label={t('coaches.filters.yearsOnTeam')}
              placeholder={t(
                'coaches.filters.yearsPlaceholder',
              )}
              value={yearsOnTeamFilter}
              onChange={(event) =>
                setYearsOnTeamFilter(
                  event.target.value,
                )
              }
            />

            <Input
              type="number"
              label={t(
                'coaches.filters.yearsExperience',
              )}
              placeholder={t(
                'coaches.filters.yearsPlaceholder',
              )}
              value={yearsExperienceFilter}
              onChange={(event) =>
                setYearsExperienceFilter(
                  event.target.value,
                )
              }
            />
          </div>

          <div className="coaches-toolbar-footer">
            <Button
              type="button"
              onClick={() => void handleSearch()}
              disabled={isSearching}
            >
              {isSearching
                ? t('common.loading')
                : t('coaches.search')}
            </Button>

            <span className="coaches-count">
              {coaches.length}
            </span>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void clearFilters()}
              >
                {t('coaches.clearFilters')}
              </Button>
            )}
          </div>
        </div>
      )}

      {loading && (
        <LoadingState
          message={t('common.loading')}
        />
      )}

      {!loading && loadError && (
        <div className="coaches-error">
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

      {!loading &&
        !loadError &&
        coaches.length === 0 && (
          <EmptyState
            title={
              hasSearched
                ? t('coaches.noResults')
                : t('coaches.emptyTitle')
            }
            description={
              hasSearched
                ? t(
                    'coaches.noResultsDescription',
                  )
                : t('coaches.emptyDescription')
            }
          />
        )}

      {!loading &&
        !loadError &&
        coaches.length > 0 && (
          <DataTable
            columns={columns}
            data={coaches}
            getRowKey={(coach: Coach) =>
              coach.team_member_id
            }
          />
        )}

      <Modal
        open={modalOpen}
        title={
          editingCoach
            ? t('coaches.editTitle')
            : t('coaches.createTitle')
        }
        onClose={closeModal}
      >
        <CoachForm
          key={editingCoach?.team_member_id ?? 'create-coach-form'}
          initialData={
            editingCoach
              ? {
                  name: editingCoach.name,
                  number: editingCoach.number,
                  years_on_team:
                    editingCoach.years_on_team,
                  team_id: editingCoach.team_id,
                  years_experience:
                    editingCoach.years_experience,
                }
              : undefined
          }
          teams={teams.map((team) => ({
            team_id: team.team_id,
            name: team.name,
          }))}
          loading={formLoading}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('coaches.deleteTitle')}
        description={
          deleteError
            ? `${t(
                'coaches.deleteDescription',
              )} ${deleteError}`
            : t('coaches.deleteDescription')
        }
        confirmLabel={t('coaches.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => void handleDelete()}
        onCancel={closeDeleteDialog}
        loading={deleteLoading}
      />
    </section>
  );
}
