import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  createMatch,
  deleteMatch,
  getMatches,
  searchMatches,
  updateMatch,
} from '../api/matches';
import type { MatchSearchFilters } from '../api/matches';
import { connectMatchesEvents } from '../api/matches-events';
import { getTeams } from '../api/teams';
import { getStadiums } from '../api/stadiums';
import { getPhases } from '../api/phases';
import { getPhaseQualification } from '../api/qualification';
import { getApiErrorMessage } from '../api/api-error';
import { useAuth } from '../auth/use-auth';
import { useSelectedSeason } from '../season/use-season';

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
import { MatchForm } from '../components/ui/MatchForm';

import type {
  Match,
  MatchFormData,
} from '../types/match';
import type { Team } from '../types/team';
import type { Stadium } from '../types/stadium';
import type { Phase } from '../types/phase';
import type { PhaseQualification } from '../types/qualification';

import './MatchesPage.css';

export default function MatchesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { season_id: seasonId } = useSelectedSeason();

  const isAdministrator =
    user?.role === 'Administrator';

  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [qualification, setQualification] =
    useState<PhaseQualification[]>([]);

  const [team1Filter, setTeam1Filter] = useState('');
  const [team2Filter, setTeam2Filter] = useState('');
  const [stadiumFilter, setStadiumFilter] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');
  const [matchDateFilter, setMatchDateFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  // Filtros de la última búsqueda (null = lista completa): toda recarga
  // (eventos, tras guardar o borrar, reintentar) repite esa misma consulta.
  const [appliedFilters, setAppliedFilters] =
    useState<MatchSearchFilters | null>(null);
  const hasSearched = appliedFilters !== null;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] =
    useState<string | null>(null);
  const [reloadCount, setReloadCount] =
    useState(0);

  const [modalOpen, setModalOpen] =
    useState(false);
  const [editingMatch, setEditingMatch] =
    useState<Match | null>(null);

  const [formLoading, setFormLoading] =
    useState(false);
  const [formError, setFormError] =
    useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<Match | null>(null);
  const [deleteLoading, setDeleteLoading] =
    useState(false);
  const [deleteError, setDeleteError] =
    useState<string | null>(null);

  useEffect(() => {
    // Descarta la respuesta si otra recarga la reemplazó o la página se desmontó.
    let ignore = false;

    async function loadData() {
      try {
        const [
          matchesData,
          teamsData,
          stadiumsData,
          phasesData,
          qualificationData,
        ] = await Promise.all([
          appliedFilters
            ? searchMatches(appliedFilters, seasonId)
            : getMatches(seasonId),
          getTeams(),
          getStadiums(),
          getPhases(seasonId),
          getPhaseQualification(seasonId),
        ]);

        if (ignore) {
          return;
        }

        setMatches(matchesData);
        setTeams(teamsData);
        setStadiums(stadiumsData);
        setPhases(phasesData);
        setQualification(qualificationData);
        setLoadError(null);
      } catch (error) {
        if (!ignore) {
          setLoadError(
            getApiErrorMessage(
              error,
              t('matches.loadError'),
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

    void loadData();

    return () => {
      ignore = true;
    };
  }, [appliedFilters, reloadCount, seasonId, t]);

  useEffect(() => {
    const disconnect =
      connectMatchesEvents({
        onEvent: () => {
          setReloadCount((count) => count + 1);
        },
      });

    return disconnect;
  }, []);

  function reloadMatches() {
    setReloadCount((count) => count + 1);
  }

  function retryLoad() {
    setLoading(true);
    setLoadError(null);
    reloadMatches();
  }

  const hasActiveFilters =
    team1Filter.trim() !== '' ||
    team2Filter.trim() !== '' ||
    stadiumFilter.trim() !== '' ||
    phaseFilter.trim() !== '' ||
    matchDateFilter.trim() !== '';

  function handleSearch() {
    setIsSearching(true);
    setAppliedFilters({
      away_team: team1Filter,
      home_team: team2Filter,
      stadium: stadiumFilter,
      phase: phaseFilter,
      match_date: matchDateFilter,
    });
  }

  function clearFilters() {
    setTeam1Filter('');
    setTeam2Filter('');
    setStadiumFilter('');
    setPhaseFilter('');
    setMatchDateFilter('');
    setAppliedFilters(null);
  }

  function openCreateModal() {
    setEditingMatch(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(match: Match) {
    setEditingMatch(match);
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (formLoading) return;

    setModalOpen(false);
    setEditingMatch(null);
    setFormError(null);
  }

  async function handleSubmit(
    data: MatchFormData,
  ) {
    setFormLoading(true);
    setFormError(null);

    try {
      if (editingMatch) {
        await updateMatch(
          editingMatch.match_id,
          data,
        );
      } else {
        await createMatch(data);
      }

      closeModal();
      reloadMatches();
    } catch (error) {
      setFormError(
        getApiErrorMessage(
          error,
          t('matches.saveError'),
        ),
      );
    } finally {
      setFormLoading(false);
    }
  }

  function openDeleteDialog(match: Match) {
    setDeleteTarget(match);
    setDeleteError(null);
  }

  function closeDeleteDialog() {
    if (deleteLoading) return;

    setDeleteTarget(null);
    setDeleteError(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await deleteMatch(
        deleteTarget.match_id,
      );

      closeDeleteDialog();
      reloadMatches();
    } catch (error) {
      setDeleteError(
        getApiErrorMessage(
          error,
          t('matches.deleteError'),
        ),
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'date',
        header: t('matches.date'),
        render: (match: Match) =>
          match.match_date,
      },
      {
        key: 'teams',
        header: t('matches.teams'),
        render: (match: Match) => (
          <div className="matches-teams">
            <span>
              {match.visitor_team_name}
            </span>
            <strong>vs.</strong>
            <span>
              {match.home_team_name}
            </span>
          </div>
        ),
      },
      {
        key: 'score',
        header: t('matches.score'),
        render: (match: Match) => (
          <span className="matches-score">
            {match.visitor_score}
            {' - '}
            {match.home_score}
          </span>
        ),
      },
      {
        key: 'stadium',
        header: t('matches.stadium'),
        render: (match: Match) =>
          match.stadium_name || '—',
      },
      {
        key: 'phase',
        header: t('matches.phase'),
        render: (match: Match) => (
          <div className="matches-phase">
            <span>{match.phase_name || '—'}</span>
            {match.tiebreaker && (
              <Badge variant="warning">
                {t('matches.tiebreakerBadge')}
              </Badge>
            )}
          </div>
        ),
      },
      {
        key: 'audience',
        header: t('matches.audience'),
        render: (match: Match) =>
          match.audience.toLocaleString(),
      },
      ...(isAdministrator
        ? [{
            key: 'actions',
            header: '',
            render: (match: Match) => (
            <div className="matches-actions">
              <IconButton
                label={`${t('common.edit')} ${match.visitor_team_name} - ${match.home_team_name}`}
                onClick={() =>
                  openEditModal(match)
                }
              >
                <Pencil
                  size={17}
                  strokeWidth={1.9}
                />
              </IconButton>

              <IconButton
                label={`${t('common.delete')} ${match.visitor_team_name} - ${match.home_team_name}`}
                variant="danger"
                onClick={() =>
                  openDeleteDialog(match)
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
    <section className="matches-page">
      <PageHeader
        eyebrow={t('matches.eyebrow')}
        title={t('matches.title')}
        description={t('matches.description')}
        actions={
          isAdministrator ? (
            <Button
              type="button"
              onClick={openCreateModal}
            >
              {t('matches.newMatch')}
            </Button>
          ) : (
            <Badge variant="neutral">
              {t('matches.viewOnly')}
            </Badge>
          )
        }
      />

      {!loading && (!loadError || hasSearched) && (
        <div className="matches-toolbar">
          <div className="matches-filters">
            <Input
              label={t('matches.filters.team1')}
              placeholder={t(
                'matches.filters.teamPlaceholder',
              )}
              value={team1Filter}
              onChange={(event) =>
                setTeam1Filter(event.target.value)
              }
            />

            <Input
              label={t('matches.filters.team2')}
              placeholder={t(
                'matches.filters.teamPlaceholder',
              )}
              value={team2Filter}
              onChange={(event) =>
                setTeam2Filter(event.target.value)
              }
            />

            <Input
              label={t('matches.filters.stadium')}
              placeholder={t(
                'matches.filters.stadiumPlaceholder',
              )}
              value={stadiumFilter}
              onChange={(event) =>
                setStadiumFilter(event.target.value)
              }
            />

            <Input
              label={t('matches.filters.phase')}
              placeholder={t(
                'matches.filters.phasePlaceholder',
              )}
              value={phaseFilter}
              onChange={(event) =>
                setPhaseFilter(event.target.value)
              }
            />

            <Input
              label={t('matches.date')}
              type="date"
              value={matchDateFilter}
              onChange={(event) =>
                setMatchDateFilter(event.target.value)
              }
            />
          </div>

          <div className="matches-toolbar-footer">
            <Button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching
                ? t('common.loading')
                : t('matches.search')}
            </Button>

            <span className="matches-count">
              {matches.length}
            </span>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="secondary"
                onClick={clearFilters}
                disabled={isSearching}
              >
                {t('matches.clearFilters')}
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
        <div className="matches-error">
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
        matches.length === 0 && (
          <EmptyState
            title={
              hasSearched
                ? t('matches.noResults')
                : t('matches.emptyTitle')
            }
            description={
              hasSearched
                ? t(
                    'matches.noResultsDescription',
                  )
                : t(
                    'matches.emptyDescription',
                  )
            }
          />
        )}

      {!loading &&
        !loadError &&
        matches.length > 0 && (
          <DataTable
            columns={columns}
            data={matches}
            getRowKey={(match: Match) =>
              match.match_id
            }
          />
        )}

      <Modal
        open={modalOpen}
        title={
          editingMatch
            ? t('matches.editTitle')
            : t('matches.createTitle')
        }
        onClose={closeModal}
      >
        <MatchForm
          key={editingMatch?.match_id ?? 'create-match-form'}
          initialData={
            editingMatch
              ? {
                  visitor_team_id:
                    editingMatch.visitor_team_id,
                  home_team_id:
                    editingMatch.home_team_id,
                  match_date:
                    editingMatch.match_date,
                  stadium_id:
                    editingMatch.stadium_id,
                  phase_id:
                    editingMatch.phase_id,
                  visitor_score:
                    editingMatch.visitor_score,
                  home_score:
                    editingMatch.home_score,
                  audience:
                    editingMatch.audience,
                  tiebreaker:
                    editingMatch.tiebreaker,
                }
              : undefined
          }
          teams={teams.map((team) => ({
            team_id: team.team_id,
            name: team.name,
          }))}
          stadiums={stadiums.map((stadium) => ({
            stadium_id:
              stadium.stadium_id,
            name: stadium.name,
            capacity: stadium.capacity,
          }))}
          phases={phases.map((phase) => ({
            phase_id: phase.phase_id,
            name: phase.name,
            start_date: phase.start_date,
            end_date: phase.end_date,
          }))}
          qualification={qualification}
          loading={formLoading}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('matches.deleteTitle')}
        description={
          deleteError
            ? `${t('matches.deleteDescription')} ${deleteError}`
            : t('matches.deleteDescription')
        }
        confirmLabel={t('matches.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={() =>
          void handleDelete()
        }
        onCancel={closeDeleteDialog}
        loading={deleteLoading}
      />
    </section>
  );
}
