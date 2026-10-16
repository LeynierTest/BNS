import {
  useCallback, useEffect,
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

export function TeamsPage() {

  const [deletingTeam, setDeletingTeam] =
    useState<Team | null>(null);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState('');  
  const { user } = useAuth();
  const { t } = useTranslation();

  const [teams, setTeams] = useState<Team[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [mascotFilter, setMascotFilter] = useState('');
  const [participatedFilter, setParticipatedFilter] = useState('');
  const [wonFilter, setWonFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const loadTeams = useCallback(async () => {
    try {
      const data = await getTeams();
      setTeams(data);
    } catch {
      setError(t('teams.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    const disconnect = connectTeamsEvents({
      onEvent: () => {
        void loadTeams();
      },
    });

    return disconnect;
  }, [loadTeams]);

  const hasActiveFilters =
    nameFilter.trim() !== '' ||
    provinceFilter.trim() !== '' ||
    colorFilter.trim() !== '' ||
    mascotFilter.trim() !== '' ||
    participatedFilter.trim() !== '' ||
    wonFilter.trim() !== '';

  async function handleSearch() {
    setIsSearching(true);
    setError('');

    try {
      const data = await searchTeams({
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

      setTeams(data);
      setHasSearched(true);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          t('teams.error'),
        ),
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function clearFilters() {
    setNameFilter('');
    setProvinceFilter('');
    setColorFilter('');
    setMascotFilter('');
    setParticipatedFilter('');
    setWonFilter('');
    setError('');

    try {
      const data = await searchTeams({});
      setTeams(data);
      setHasSearched(true);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          t('teams.error'),
        ),
      );
    }
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
      const createdTeam = await createTeam(data);

      setTeams((currentTeams) =>
        [...currentTeams, createdTeam].sort(
          (a, b) => a.team_id - b.team_id,
        ),
      );

      setIsCreateModalOpen(false);
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

      setTeams((currentTeams) =>
        currentTeams.filter(
          (team) =>
            team.team_id !== deletingTeam.team_id,
        ),
      );

      setDeletingTeam(null);
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
      const updatedTeam = await updateTeam(
        editingTeam.team_id,
        data,
      );

      setTeams((currentTeams) =>
        currentTeams.map((team) =>
          team.team_id === updatedTeam.team_id
            ? updatedTeam
            : team,
        ),
      );

      setEditingTeam(null);
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
            <Button onClick={openCreateModal}>
              {t('teams.newTeam')}
            </Button>
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
            onClick={() => void handleSearch()}
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
              onClick={() =>
                window.location.reload()
              }
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
