import { useTranslation } from 'react-i18next';

import type {
  PhaseBlock,
  PhaseQualification,
  PhaseStanding,
  QualificationTeam,
} from '../../types/qualification';
import { Badge } from './Badge';
import { Card } from './Card';
import DataTable, { type DataTableColumn } from './DataTable';
import './PhaseQualificationPanel.css';

type TeamStatus = 'qualified' | 'tied' | 'out';

const STATUS_VARIANT = {
  qualified: 'success',
  tied: 'warning',
  out: 'neutral',
} as const;

const BLOCKED_KEY: Record<PhaseBlock['reason'], string> = {
  'missing-previous-phase': 'qualification.blocked.missingPreviousPhase',
  'previous-phase-undecided': 'qualification.blocked.previousPhaseUndecided',
  'previous-cut-tied': 'qualification.blocked.previousCutTied',
};

function getTeamStatus(
  phase: PhaseQualification,
  teamId: number,
): TeamStatus | null {
  const { cut } = phase;

  if (!cut || cut.status === 'undecided') {
    return null;
  }

  if (cut.qualified.some((team) => team.team_id === teamId)) {
    return 'qualified';
  }

  if (
    cut.status === 'tied' &&
    cut.tie?.contenders.some((team) => team.team_id === teamId)
  ) {
    return 'tied';
  }

  return 'out';
}

type PhaseQualificationPanelProps = {
  phases: PhaseQualification[];
};

/** Equipos activos, tabla y corte de cada fase de la Serie (regla 8/4/2). */
export function PhaseQualificationPanel({
  phases,
}: PhaseQualificationPanelProps) {
  const { t } = useTranslation();

  return (
    <section
      className="phase-qualification"
      aria-labelledby="phase-qualification-title"
    >
      <header className="phase-qualification-header">
        <h2 id="phase-qualification-title">
          {t('qualification.title')}
        </h2>
        <p>{t('qualification.description')}</p>
      </header>

      <div className="phase-qualification-grid">
        {phases.map((phase) => (
          <PhaseQualificationCard
            key={phase.name}
            phase={phase}
          />
        ))}
      </div>
    </section>
  );
}

function PhaseQualificationCard({
  phase,
}: {
  phase: PhaseQualification;
}) {
  const { t, i18n } = useTranslation();

  function formatTeams(teams: QualificationTeam[]) {
    return new Intl.ListFormat(i18n.language, {
      type: 'conjunction',
    }).format(teams.map((team) => team.team_name));
  }

  const columns: DataTableColumn<PhaseStanding>[] = [
    {
      key: 'position',
      header: '#',
      render: (_team, index) => index + 1,
    },
    {
      key: 'team',
      header: t('qualification.team'),
      render: (team) => team.team_name,
    },
    {
      key: 'games',
      header: t('qualification.games'),
      render: (team) => team.games_played,
    },
    {
      key: 'points',
      header: t('qualification.points'),
      render: (team) => <strong>{team.points}</strong>,
    },
    {
      key: 'status',
      header: t('qualification.status'),
      render: (team) => {
        const status = getTeamStatus(phase, team.team_id);

        return status ? (
          <Badge variant={STATUS_VARIANT[status]}>
            {t(`qualification.teamStatus.${status}`)}
          </Badge>
        ) : (
          '—'
        );
      },
    },
  ];

  const { cut } = phase;
  const tie = cut?.tie ?? null;

  return (
    <Card className="phase-qualification-card">
      <div className="phase-qualification-card-header">
        <h3>{phase.name}</h3>
        <Badge variant="neutral">
          {phase.active_teams === null
            ? t('qualification.allTeams')
            : t('qualification.activeTeams', {
                count: phase.active_teams,
              })}
        </Badge>
      </div>

      {phase.phase_id === null && (
        <p className="phase-qualification-note">
          {t('qualification.notCreated')}
        </p>
      )}

      {phase.blocked ? (
        <p className="phase-qualification-note is-waiting">
          {t(BLOCKED_KEY[phase.blocked.reason], {
            previous: phase.blocked.previous_phase,
          })}
        </p>
      ) : phase.phase_id === null ? (
        phase.participants.length > 0 && (
          <p className="phase-qualification-note">
            {t('qualification.participants', {
              teams: formatTeams(phase.participants),
            })}
          </p>
        )
      ) : (
        <DataTable
          columns={columns}
          data={phase.standings}
          getRowKey={(team) => team.team_id}
        />
      )}

      {cut?.status === 'undecided' && (
        <p className="phase-qualification-note">
          {t('qualification.undecided', { count: cut.slots })}
        </p>
      )}

      {tie && (
        <div
          className={[
            'phase-qualification-tie',
            cut?.status === 'tied' ? 'is-open' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <p>
            {cut?.status === 'tied'
              ? t('qualification.tieOpen', {
                  count: tie.spots,
                  teams: formatTeams(tie.contenders),
                  points: t('qualification.pointsLabel', {
                    count: tie.points,
                  }),
                })
              : t('qualification.tieResolved', {
                  count: tie.contenders.length,
                  teams: formatTeams(tie.contenders),
                })}
          </p>

          {tie.series.length > 0 && (
            <ul>
              {tie.series.map((series) => (
                <li
                  key={`${series.team_a.team_id}-${series.team_b.team_id}`}
                >
                  {series.team_a.team_name}{' '}
                  <strong>
                    {series.wins_a} – {series.wins_b}
                  </strong>{' '}
                  {series.team_b.team_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
