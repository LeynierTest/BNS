import {
  useState,
  type FormEvent,
} from 'react';
import { useTranslation } from 'react-i18next';

import type { MatchFormData } from '../../types/match';
import type { PhaseQualification } from '../../types/qualification';
import { Button } from './Button';
import { ErrorMessage } from './ErrorMessage';
import { Input } from './Input';
import { Select } from './Select';
import {
  getMatchQualificationError,
  getPhaseBlockedError,
} from './match-form-rules';
import type { RuleError } from './match-form-rules';
import './MatchForm.css';

export interface MatchTeamOption {
  team_id: number;
  name: string;
}

export interface MatchStadiumOption {
  stadium_id: number;
  name: string;
  capacity: number;
}

export interface MatchPhaseOption {
  phase_id: number;
  name: string;
  start_date: string;
  end_date: string;
}

type MatchFormProps = {
  initialData?: MatchFormData;
  teams: MatchTeamOption[];
  stadiums: MatchStadiumOption[];
  phases: MatchPhaseOption[];
  /** Equipos activos y corte de cada fase (GET /qualification). */
  qualification?: PhaseQualification[];
  loading?: boolean;
  error?: string | null;
  onSubmit: (data: MatchFormData) => void | Promise<void>;
  onCancel: () => void;
};

export function MatchForm({
  initialData,
  teams,
  stadiums,
  phases,
  qualification = [],
  loading = false,
  error = null,
  onSubmit,
  onCancel,
}: MatchFormProps) {
  const { t, i18n } = useTranslation();

  const [visitorTeamId, setVisitorTeamId] = useState(
    initialData?.visitor_team_id?.toString() ?? '',
  );

  const [homeTeamId, setHomeTeamId] = useState(
    initialData?.home_team_id?.toString() ?? '',
  );

  const [matchDate, setMatchDate] = useState(
    initialData?.match_date ?? '',
  );

  const [stadiumId, setStadiumId] = useState(
    initialData?.stadium_id?.toString() ?? '',
  );

  const [phaseId, setPhaseId] = useState(
    initialData?.phase_id?.toString() ?? '',
  );

  const [visitorScore, setVisitorScore] = useState(
    initialData?.visitor_score?.toString() ?? '0',
  );

  const [homeScore, setHomeScore] = useState(
    initialData?.home_score?.toString() ?? '0',
  );

  const [audience, setAudience] = useState(
    initialData?.audience?.toString() ?? '0',
  );

  const [tiebreaker, setTiebreaker] = useState(
    initialData?.tiebreaker ?? false,
  );

  const [validationError, setValidationError] =
    useState<string | null>(null);

  const selectedPhaseState = qualification.find(
    (state) => state.phase_id === Number(phaseId),
  );
  const activeTeamIds =
    selectedPhaseState && !selectedPhaseState.blocked
      ? new Set(
          selectedPhaseState.participants.map(
            (team) => team.team_id,
          ),
        )
      : null;

  function formatList(names: string[]) {
    return new Intl.ListFormat(i18n.language, {
      type: 'conjunction',
    }).format(names);
  }

  function translate(ruleError: RuleError | null) {
    return ruleError ? t(ruleError.key, ruleError.values) : null;
  }

  function teamOptions(placeholder: string) {
    return [
      {
        value: '',
        label: placeholder,
      },
      ...teams.map((team) => {
        const inactive =
          activeTeamIds !== null &&
          !activeTeamIds.has(team.team_id);

        return {
          value: team.team_id.toString(),
          label: inactive
            ? `${team.name} (${t('matches.notActive')})`
            : team.name,
          disabled: inactive,
        };
      }),
    ];
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    const visitor = Number(visitorTeamId);
    const home = Number(homeTeamId);
    const stadium = Number(stadiumId);
    const phase = Number(phaseId);
    const visitorRuns = Number(visitorScore);
    const homeRuns = Number(homeScore);
    const attendance = Number(audience);

    if (!visitorTeamId) {
      setValidationError(t('matches.validation.visitorTeamRequired'));
      return;
    }

    if (!homeTeamId) {
      setValidationError(t('matches.validation.homeTeamRequired'));
      return;
    }

    if (visitor === home) {
      setValidationError(t('matches.validation.teamsMustDiffer'));
      return;
    }

    if (!matchDate) {
      setValidationError(t('matches.validation.dateRequired'));
      return;
    }

    if (!stadiumId) {
      setValidationError(t('matches.validation.stadiumRequired'));
      return;
    }

    if (!phaseId) {
      setValidationError(t('matches.validation.phaseRequired'));
      return;
    }

    const selectedPhase = phases.find(
      (option) => option.phase_id === phase,
    );

    if (
      selectedPhase &&
      (matchDate < selectedPhase.start_date ||
        matchDate > selectedPhase.end_date)
    ) {
      setValidationError(
        t('matches.validation.dateOutsidePhase', {
          phase: selectedPhase.name,
          start: selectedPhase.start_date,
          end: selectedPhase.end_date,
        }),
      );
      return;
    }

    if (
      !Number.isInteger(visitorRuns) ||
      visitorRuns < 0
    ) {
      setValidationError(t('matches.validation.visitorScoreInvalid'));
      return;
    }

    if (
      !Number.isInteger(homeRuns) ||
      homeRuns < 0
    ) {
      setValidationError(t('matches.validation.homeScoreInvalid'));
      return;
    }

    if (
      !Number.isInteger(attendance) ||
      attendance < 0
    ) {
      setValidationError(t('matches.validation.audienceInvalid'));
      return;
    }

    const selectedStadium = stadiums.find(
      (option) => option.stadium_id === stadium,
    );

    if (
      selectedStadium &&
      attendance > selectedStadium.capacity
    ) {
      setValidationError(
        t('matches.validation.audienceExceedsCapacity', {
          capacity: selectedStadium.capacity,
        }),
      );
      return;
    }

    if (tiebreaker && visitorRuns === homeRuns) {
      setValidationError(t('matches.validation.tiebreakerDraw'));
      return;
    }

    // Al editar sin tocar equipos, fase ni desempate no se revalida: así se
    // pueden corregir otros datos de partidos anteriores a la regla.
    const ruleFieldsChanged =
      !initialData ||
      initialData.visitor_team_id !== visitor ||
      initialData.home_team_id !== home ||
      initialData.phase_id !== phase ||
      initialData.tiebreaker !== tiebreaker;
    const phaseState = qualification.find(
      (state) => state.phase_id === phase,
    );
    const qualificationError =
      phaseState && ruleFieldsChanged
        ? translate(
            getMatchQualificationError(
              phaseState,
              teams,
              [visitor, home],
              tiebreaker && !initialData,
              formatList,
            ),
          )
        : null;

    if (qualificationError) {
      setValidationError(qualificationError);
      return;
    }

    void onSubmit({
      visitor_team_id: visitor,
      home_team_id: home,
      match_date: matchDate,
      stadium_id: stadium,
      phase_id: phase,
      visitor_score: visitorRuns,
      home_score: homeRuns,
      audience: attendance,
      tiebreaker,
    });
  }

  return (
    <form className="match-form" onSubmit={handleSubmit}>
      {error && <ErrorMessage message={error} />}
      {validationError && <ErrorMessage message={validationError} />}

      <div className="match-form-grid">
        <Select
          label={t('matches.visitorTeam')}
          value={visitorTeamId}
          onChange={(event) =>
            setVisitorTeamId(event.target.value)
          }
          disabled={loading}
          options={teamOptions(t('matches.selectVisitorTeam'))}
        />

        <Select
          label={t('matches.homeTeam')}
          value={homeTeamId}
          onChange={(event) =>
            setHomeTeamId(event.target.value)
          }
          disabled={loading}
          options={teamOptions(t('matches.selectHomeTeam'))}
        />

        <Input
          label={t('matches.date')}
          type="date"
          value={matchDate}
          onChange={(event) =>
            setMatchDate(event.target.value)
          }
          disabled={loading}
        />

        <Select
          label={t('matches.stadium')}
          value={stadiumId}
          onChange={(event) =>
            setStadiumId(event.target.value)
          }
          disabled={loading}
          options={[
            {
              value: '',
              label: t('matches.selectStadium'),
            },
            ...stadiums.map((stadium) => ({
              value: stadium.stadium_id.toString(),
              label: stadium.name,
            })),
          ]}
        />

        <Select
          label={t('matches.phase')}
          value={phaseId}
          onChange={(event) =>
            setPhaseId(event.target.value)
          }
          disabled={loading}
          hint={
            selectedPhaseState
              ? (translate(
                  getPhaseBlockedError(selectedPhaseState, formatList),
                ) ??
                t('matches.activeTeamsHint', {
                  count: selectedPhaseState.participants.length,
                }))
              : undefined
          }
          options={[
            {
              value: '',
              label: t('matches.selectPhase'),
            },
            ...phases.map((phase) => ({
              value: phase.phase_id.toString(),
              label: phase.name,
            })),
          ]}
        />

        <Input
          label={t('matches.visitorScore')}
          type="number"
          min="0"
          value={visitorScore}
          onChange={(event) =>
            setVisitorScore(event.target.value)
          }
          disabled={loading}
        />

        <Input
          label={t('matches.homeScore')}
          type="number"
          min="0"
          value={homeScore}
          onChange={(event) =>
            setHomeScore(event.target.value)
          }
          disabled={loading}
        />

        <Input
          label={t('matches.audience')}
          type="number"
          min="0"
          value={audience}
          onChange={(event) =>
            setAudience(event.target.value)
          }
          disabled={loading}
        />
      </div>

      <label className="match-form-checkbox">
        <input
          type="checkbox"
          checked={tiebreaker}
          onChange={(event) =>
            setTiebreaker(event.target.checked)
          }
          disabled={loading}
        />
        <span>
          <strong>{t('matches.tiebreaker')}</strong>
          <small>{t('matches.tiebreakerHint')}</small>
        </span>
      </label>

      <div className="match-form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          {t('common.cancel')}
        </Button>

        <Button
          type="submit"
          loading={loading}
        >
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
