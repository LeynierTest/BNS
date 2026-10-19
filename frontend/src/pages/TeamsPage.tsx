import {
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  createTeam,
  deleteTeam,
  getTeams,
  searchTeams,
  updateTeam,
} from '../api/teams';
import type { TeamSearchFilters } from '../api/teams';
import { getApiErrorMessage } from '../api/api-error';
import { useAuth } from '../auth/use-auth';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Input } from '../components/ui/Input';
import { LoadingState } from '../components/ui/LoadingState';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { TeamCard } from '../components/ui/TeamCard';
import { TeamForm } from '../components/ui/TeamForm';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

import type {
  Team,
  TeamFormData,
} from '../types/team';
import './TeamsPage.css';
import { connectTeamsEvents } from '../api/teams-events';
import { useSelectedSeason } from '../season/use-season';
import { seasonLabel } from '../types/season';

export function TeamsPage() {

  const [deletingTeam, setDeletingTeam] =
    useState<Team | null>(null);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState('');  
  const { user } = useAuth();
  const { t } = useTranslation();
  const season = useSelectedSeason();

  const [teams, setTeams] = useState<Team[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [mascotFilter, setMascotFilter] = useState('');
  const [participatedFilter, setParticipatedFilter] = useState('');
  const [wonFilter, setWonFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  // Filtros de la última búsqueda (null = lista completa): toda recarga
  // (eventos, tras guardar o borrar, reintentar) repite esa misma consulta.
  const [appliedFilters, setAppliedFilters] =
    useState<TeamSearchFilters | null>(null);
  const hasSearched = appliedFilters !== null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  const [isCreating, setIsCreating] =
    useState(false);

  const [formError, setFormError] =
    useState('');

  const [editingTeam, setEditingTeam] =
    useState<Team | null>(null);

  const [isUpdating, setIsUpdating] =
    useState(false);

  const [editFormError, setEditFormError] =
    useState('');

  useEffect(() => {
    // Descarta la respuesta si otra recarga la reemplazó o la página se desmontó.
    let ignore = false;

    async function loadTeams() {
      try {
        const data = appliedFilters
          ? await searchTeams(appliedFilters)
          : await getTeams();

        if (ignore) {
          return;
        }

        setTeams(data);
        setError('');
      } catch (requestError) {
        if (!ignore) {
          setError(
            getApiErrorMessage(requestError, t('teams.error')),
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          setIsSearching(false);
        }
      }
    }

    void loadTeams();

    return () => {
      ignore = true;
    };
  }, [appliedFilters, reloadCount, t]);

  useEffect(() => {
    const disconnect = connectTeamsEvents({
      onEvent: () => {
        setReloadCount((count) => count + 1);
      },
    });

    return disconnect;
  }, []);

  function reloadTeams() {
    setReloadCount((count) => count + 1);
  }

  function retryLoad() {
    setLoading(true);
    setError('');
    reloadTeams();
  }

  const hasActiveFilters =
    nameFilter.trim() !== '' ||
    provinceFilter.trim() !== '' ||
    colorFilter.trim() !== '' ||
    mascotFilter.trim() !== '' ||
    participatedFilter.trim() !== '' ||
    wonFilter.trim() !== '';

  function handleSearch() {
    setIsSearching(true);
    setAppliedFilters({
      ...(nameFilter.trim()
        ? { name: nameFilter.trim() }
        : {}),
      ...(provinceFilter.trim()
        ? { province: provinceFilter.trim() }
        : {}),
      ...(colorFilter.trim()
        ? { color: colorFilter.trim() }
        : {}),
      ...(mascotFilter.trim()
        ? { mascot: mascotFilter.trim() }
        : {}),
      ...(participatedFilter.trim()
        ? {
            championships_participated:
              Number(participatedFilter),
          }
        : {}),
      ...(wonFilter.trim()
        ? {
            championships_won:
              Number(wonFilter),
          }
        : {}),
    });
  }

  function clearFilters() {
    setNameFilter('');
    setProvinceFilter('');
    setColorFilter('');
    setMascotFilter('');
    setParticipatedFilter('');
    setWonFilter('');
    setAppliedFilters(null);
  }

  const isAdministrator =
    user?.role === 'Administrator';

  function openCreateModal() {
    setFormError('');
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    if (isCreating) {
      return;
    }

    setFormError('');
    setIsCreateModalOpen(false);
  }

  async function handleCreateTeam(
    data: TeamFormData,
  ) {
    setIsCreating(true);
    setFormError('');

    try {
      // Se inscribe en la temporada que se está viendo.
      await createTeam(data, season.season_id);

      setIsCreateModalOpen(false);
      reloadTeams();
    } catch (requestError) {
      setFormError(
        getApiErrorMessage(
          requestError,
          t('teams.form.createError'),
        ),
      );
    } finally {
      setIsCreating(false);
    }
  }

  function openDeleteDialog(team: Team) {
  setDeleteError('');
  setDeletingTeam(team);
  }

  function closeDeleteDialog() {
    if (isDeleting) {
      return;
    }

    setDeleteError('');
    setDeletingTeam(null);
  }

  async function handleDeleteTeam() {
    if (!deletingTeam) {
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteTeam(deletingTeam.team_id);

      setDeletingTeam(null);
      reloadTeams();
    } catch (requestError) {
      setDeleteError(
        getApiErrorMessage(
          requestError,
          t('teams.deleteError'),
        ),
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function openEditModal(team: Team) {
    setEditFormError('');
    setEditingTeam(team);
  }

  function closeEditModal() {
    if (isUpdating) {
      return;
    }

    setEditFormError('');
    setEditingTeam(null);
  }

  async function handleUpdateTeam(
    data: TeamFormData,
  ) {
    if (!editingTeam) {
      return;
    }

    setIsUpdating(true);
    setEditFormError('');

    try {
      await updateTeam(
        editingTeam.team_id,
        data,
      );

      setEditingTeam(null);
      reloadTeams();
    } catch (requestError) {
      setEditFormError(
        getApiErrorMessage(
          requestError,
          t('teams.form.updateError'),
        ),
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <section className="teams-page">
      <PageHeader
        eyebrow={t('teams.eyebrow')}
        title={t('teams.title')}
        description={t('teams.description')}
        actions={
          isAdministrator ? (
            <div className="teams-header-actions">
              {season.started && (
                <span className="teams-season-locked">
                  {t('teams.seasonStarted', {
                    season: seasonLabel(season),
                  })}
                </span>
              )}
              <Button
                onClick={openCreateModal}
                disabled={season.started}
              >
                {t('teams.newTeam')}
              </Button>
            </div>
          ) : (
            <Badge variant="neutral">
              {t('teams.viewOnly')}
            </Badge>
          )
        }
      />

      <section className="teams-toolbar">
        <div className="teams-filters">
          <Input
            label={t('teams.filters.name')}
            placeholder={t('teams.filters.namePlaceholder')}
            value={nameFilter}
            onChange={(event) =>
              setNameFilter(event.target.value)
            }
            aria-label={t('teams.filters.name')}
          />

          <Input
            label={t('teams.filters.province')}
            placeholder={t('teams.filters.provincePlaceholder')}
            value={provinceFilter}
            onChange={(event) =>
              setProvinceFilter(event.target.value)
            }
            aria-label={t('teams.filters.province')}
          />

          <Input
            label={t('teams.filters.color')}
            placeholder={t('teams.filters.colorPlaceholder')}
            value={colorFilter}
            onChange={(event) =>
              setColorFilter(event.target.value)
            }
            aria-label={t('teams.filters.color')}
          />

          <Input
            label={t('teams.filters.mascot')}
            placeholder={t('teams.filters.mascotPlaceholder')}
            value={mascotFilter}
            onChange={(event) =>
              setMascotFilter(event.target.value)
            }
            aria-label={t('teams.filters.mascot')}
          />

          <Input
            label={t('teams.filters.participated')}
            placeholder={t('teams.filters.numberPlaceholder')}
            type="number"
            min="0"
            value={participatedFilter}
            onChange={(event) =>
              setParticipatedFilter(event.target.value)
            }
            aria-label={t('teams.filters.participated')}
          />

          <Input
            label={t('teams.filters.won')}
            placeholder={t('teams.filters.numberPlaceholder')}
            type="number"
            min="0"
            value={wonFilter}
            onChange={(event) =>
              setWonFilter(event.target.value)
            }
            aria-label={t('teams.filters.won')}
          />
        </div>

        <div className="teams-toolbar-footer">
          <Button
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching
              ? t('teams.loading')
              : t('teams.searchLabel')}
          </Button>

          <div className="teams-count">
            <strong>
              {teams.length}
            </strong>

            <span>
              {t('teams.teamCount')}
            </span>
          </div>

          {hasActiveFilters && (
            <Button
              variant="secondary"
              onClick={clearFilters}
            >
              {t('teams.clearFilters')}
            </Button>
          )}
        </div>
      </section>

      {error ? (
        <ErrorMessage
          message={error}
          action={
            <Button
              variant="secondary"
              onClick={retryLoad}
            >
              {t('teams.retry')}
            </Button>
          }
        />
      ) : loading ? (
        <LoadingState
          message={t('teams.loading')}
        />
      ) : teams.length === 0 && hasSearched ? (
        <EmptyState
          title={t('teams.noResults')}
          description={t(
            'teams.noResultsDescription',
          )}
          action={
            <Button
              variant="secondary"
              onClick={clearFilters}
            >
              {t('teams.clearSearch')}
            </Button>
          }
        />
      ) : teams.length === 0 ? (
        <EmptyState
          title={t('teams.empty')}
          description={t(
            'teams.emptyDescription',
          )}
        />
      ) : (
        <div className="teams-grid">
          {teams.map((team) => (
            <TeamCard
              key={team.team_id}
              team={team}
              canEdit={isAdministrator}
              onEdit={openEditModal}
              onDelete={openDeleteDialog}
            />
          ))}
        </div>
      )}

      <Modal
        open={isCreateModalOpen}
        onClose={closeCreateModal}
        title={t('teams.form.createTitle')}
        description={t(
          'teams.form.createDescription',
        )}
        closeOnOverlayClick={!isCreating}
      >
        <TeamForm
          key="create-team-form"
          onSubmit={handleCreateTeam}
          onCancel={closeCreateModal}
          loading={isCreating}
          serverError={formError}
        />
      </Modal>

      <Modal
        open={editingTeam !== null}
        onClose={closeEditModal}
        title={t('teams.form.editTitle')}
        description={t(
          'teams.form.editDescription',
        )}
        closeOnOverlayClick={!isUpdating}
      >
        {editingTeam && (
          <TeamForm
            key={editingTeam.team_id}
            initialValues={editingTeam}
            onSubmit={handleUpdateTeam}
            onCancel={closeEditModal}
            loading={isUpdating}
            serverError={editFormError}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deletingTeam !== null}
        title={t('teams.deleteTitle')}
        description={
          deleteError ||
          t('teams.deleteDescription')
        }
        onConfirm={handleDeleteTeam}
        onCancel={closeDeleteDialog}
        confirmLabel={t('teams.delete')}
        cancelLabel={t('common.cancel')}
        loading={isDeleting}
      />
    </section>
  );
}
