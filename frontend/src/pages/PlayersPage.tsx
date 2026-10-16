import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  createPlayer,
  deletePlayer,
  getPlayers,
  searchPlayers,
  updatePlayer,
} from '../api/players';
import type { PlayerFormData } from '../api/players';
import { getTeams } from '../api/teams';
import { getApiErrorMessage } from '../api/api-error';

import type { Player } from '../types/player';
import type { Team } from '../types/team';

import { useAuth } from '../auth/use-auth';

import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import DataTable from '../components/ui/DataTable';
import type { DataTableColumn } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Input } from '../components/ui/Input';
import { IconButton } from '../components/ui/IconButton';
import { LoadingState } from '../components/ui/LoadingState';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { PlayerForm } from '../components/ui/PlayerForm';

import './PlayersPage.css';
import { connectPlayersEvents } from '../api/players-events';

export default function PlayersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const isAdministrator = user?.role === 'Administrator';

  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [numberFilter, setNumberFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const playersPromise = getPlayers();

      const [playerData, teamData] = await Promise.all([
        playersPromise,
        isAdministrator ? getTeams() : Promise.resolve([]),
      ]);

      setPlayers(playerData);
      setTeams(teamData);
    } catch (err) {
      setError(getApiErrorMessage(err, t('players.loadError')));
    } finally {
      setLoading(false);
    }
  }, [isAdministrator, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const disconnect = connectPlayersEvents({
      onEvent: () => {
        void loadData();
      },
    });

    return disconnect;
  }, [loadData]);

  const hasActiveFilters =
    numberFilter.trim() !== '' ||
    nameFilter.trim() !== '' ||
    teamFilter.trim() !== '' ||
    positionFilter.trim() !== '';

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError('');

      const normalizedNumber = numberFilter.trim();
      const playerData = await searchPlayers({
        number:
          normalizedNumber !== ''
            ? Number(normalizedNumber)
            : undefined,
        name: nameFilter.trim() || undefined,
        team: teamFilter.trim() || undefined,
        position: positionFilter.trim() || undefined,
      });

      setPlayers(playerData);
      setHasSearched(true);
    } catch (err) {
      setError(getApiErrorMessage(err, t('players.loadError')));
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = async () => {
    setNumberFilter('');
    setNameFilter('');
    setTeamFilter('');
    setPositionFilter('');
    setHasSearched(false);

    try {
      setLoading(true);
      setError('');

      const playerData = await getPlayers();
      setPlayers(playerData);
    } catch (err) {
      setError(getApiErrorMessage(err, t('players.loadError')));
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setCreateError('');
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (creating) {
      return;
    }

    setCreateError('');
    setCreateModalOpen(false);
  };

  const handleCreate = async (data: PlayerFormData) => {
    try {
      setCreating(true);
      setCreateError('');

      const createdPlayer = await createPlayer(data);

      setPlayers((current) =>
        [...current, createdPlayer].sort(
          (a, b) => a.team_member_id - b.team_member_id,
        ),
      );

      setCreateModalOpen(false);
    } catch (err) {
      setCreateError(
        getApiErrorMessage(err, t('players.loadError')),
      );
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (player: Player) => {
    setUpdateError('');
    setEditingPlayer(player);
  };

  const closeEditModal = () => {
    if (updating) {
      return;
    }

    setUpdateError('');
    setEditingPlayer(null);
  };

  const getPlayerFormValues = (
    player: Player,
  ): Partial<PlayerFormData> => ({
    name: player.team_member.name,
    number: player.team_member.number,
    years_on_team: player.team_member.years_on_team,
    team_id: player.team_member.team.team_id,
    position: player.position,
    at_bats: player.at_bats,
    innings_pitched: player.innings_pitched,
    hits: player.hits,
    runs_allowed: player.runs_allowed,
    batting_average: Number(player.batting_average),
  });

  const handleUpdate = async (data: PlayerFormData) => {
    if (!editingPlayer) {
      return;
    }

    try {
      setUpdating(true);
      setUpdateError('');

      const updatedPlayer = await updatePlayer(
        editingPlayer.team_member_id,
        data,
      );

      setPlayers((current) =>
        current.map((player) =>
          player.team_member_id === updatedPlayer.team_member_id
            ? updatedPlayer
            : player,
        ),
      );

      setEditingPlayer(null);
    } catch (err) {
      setUpdateError(
        getApiErrorMessage(err, t('players.loadError')),
      );
    } finally {
      setUpdating(false);
    }
  };

  const openDeleteDialog = (player: Player) => {
    setDeleteError('');
    setDeletingPlayer(player);
  };

  const closeDeleteDialog = () => {
    if (deleting) {
      return;
    }

    setDeleteError('');
    setDeletingPlayer(null);
  };

  const handleDelete = async () => {
    if (!deletingPlayer) {
      return;
    }

    try {
      setDeleting(true);
      setDeleteError('');

      await deletePlayer(deletingPlayer.team_member_id);

      setPlayers((current) =>
        current.filter(
          (player) =>
            player.team_member_id !==
            deletingPlayer.team_member_id,
        ),
      );

      setDeletingPlayer(null);
    } catch (err) {
      setDeleteError(
        getApiErrorMessage(err, t('players.deleteError')),
      );
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<DataTableColumn<Player>[]>(
    () => {
      const baseColumns: DataTableColumn<Player>[] = [
        {
          key: 'number',
          header: t('players.number'),
          render: (player) => (
            <span className="players-number">
              #{player.team_member.number}
            </span>
          ),
        },
        {
          key: 'name',
          header: t('players.name'),
          render: (player) => (
            <span className="players-name">
              {player.team_member.name}
            </span>
          ),
        },
        {
          key: 'team',
          header: t('players.team'),
          render: (player) => (
            <span className="players-team">
              {player.team_member.team.name}
            </span>
          ),
        },
        {
          key: 'position',
          header: t('players.position'),
          render: (player) => (
            <span className="players-position">
              {player.position}
            </span>
          ),
        },
      ];

      if (!isAdministrator) {
        return baseColumns;
      }

      return [
        ...baseColumns,
        {
          key: 'actions',
          header: '',
          render: (player) => (
            <div className="players-actions">
              <IconButton
                label={t('players.edit')}
                onClick={() => openEditModal(player)}
              >
                <Pencil
                  size={16}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
              </IconButton>

              <IconButton
                label={t('players.delete')}
                variant="danger"
                onClick={() => openDeleteDialog(player)}
              >
                <Trash2
                  size={16}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
              </IconButton>
            </div>
          ),
        },
      ];
    },
    [isAdministrator, t],
  );

  return (
    <div className="players-page">
      <PageHeader
        title={t('players.title')}
        actions={
          isAdministrator ? (
            <Button type="button" onClick={openCreateModal}>
              {t('players.newPlayer')}
            </Button>
          ) : undefined
        }
      />

      <div className="players-toolbar">
        <div className="players-filters">
          <Input
            type="number"
            label={t('players.filters.number')}
            value={numberFilter}
            onChange={(event) => setNumberFilter(event.target.value)}
            placeholder={t('players.filters.numberPlaceholder')}
          />

          <Input
            label={t('players.filters.name')}
            value={nameFilter}
            onChange={(event) => setNameFilter(event.target.value)}
            placeholder={t('players.filters.namePlaceholder')}
          />

          <Input
            label={t('players.filters.team')}
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
            placeholder={t('players.filters.teamPlaceholder')}
          />

          <Input
            label={t('players.filters.position')}
            value={positionFilter}
            onChange={(event) => setPositionFilter(event.target.value)}
            placeholder={t('players.filters.positionPlaceholder')}
          />
        </div>

        <div className="players-toolbar-footer">
          <Button
            type="button"
            onClick={() => void handleSearch()}
          >
            {t('players.search')}
          </Button>
          <div className="players-count">
            {players.length}
          </div>

          {hasActiveFilters && (
            <Button
              variant="secondary"
              type="button"
              onClick={clearFilters}
            >
              {t('players.clearFilters')}
            </Button>
          )}
        </div>
      </div>

      {loading && <LoadingState />}

      {!loading && error && (
        <div className="players-error">
          <ErrorMessage message={error} />

          <Button
            type="button"
            variant="secondary"
            onClick={() => void loadData()}
          >
            {t('common.retry')}
          </Button>
        </div>
      )}

      {!loading && !error && players.length === 0 && (
        <EmptyState
          title={t('players.emptyTitle')}
          description={
            hasSearched
              ? t('players.emptySearch')
              : t('players.emptyDescription')
          }
        />
      )}

      {!loading && !error && players.length > 0 && (
        <DataTable
          columns={columns}
          data={players}
          getRowKey={(player) => player.team_member_id}
        />
      )}

      {isAdministrator && (
        <Modal
          open={createModalOpen}
          onClose={closeCreateModal}
          title={t('players.newPlayer')}
        >
          <PlayerForm
            teams={teams}
            onSubmit={handleCreate}
            onCancel={closeCreateModal}
            loading={creating}
            serverError={createError}
          />
        </Modal>
      )}

      {isAdministrator && editingPlayer && (
        <Modal
          open={Boolean(editingPlayer)}
          onClose={closeEditModal}
          title={t('players.editTitle')}
          description={t('players.editDescription')}
        >
          <PlayerForm
            teams={teams}
            initialValues={getPlayerFormValues(editingPlayer)}
            onSubmit={handleUpdate}
            onCancel={closeEditModal}
            loading={updating}
            serverError={updateError}
          />
        </Modal>
      )}

      {isAdministrator && deletingPlayer && (
        <ConfirmDialog
          open={Boolean(deletingPlayer)}
          title={t('players.deleteTitle')}
          description={
            <>
              <p>{t('players.deleteDescription')}</p>
              <strong>{deletingPlayer.team_member.name}</strong>
            </>
          }
          confirmLabel={t('players.delete')}
          cancelLabel={t('players.form.cancel')}
          onConfirm={() => void handleDelete()}
          onCancel={closeDeleteDialog}
          loading={deleting}
        />
      )}

      {deleteError && (
        <div className="players-delete-error">
          <ErrorMessage message={deleteError} />
        </div>
      )}
    </div>
  );
}
