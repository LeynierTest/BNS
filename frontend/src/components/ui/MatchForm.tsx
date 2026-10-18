import {
  useState,
  type FormEvent,
} from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from './Button';
import { ErrorMessage } from './ErrorMessage';
import { Input } from './Input';
import { Select } from './Select';
import './MatchForm.css';

export interface MatchTeamOption {
  team_id: number;
  name: string;
}

export interface MatchStadiumOption {
  stadium_id: number;
  name: string;
}

export interface MatchPhaseOption {
  phase_id: number;
  name: string;
}

export interface MatchFormData {
  visitor_team_id: number;
  home_team_id: number;
  match_date: string;
  stadium_id: number;
  phase_id: number;
  visitor_score: number;
  home_score: number;
  audience: number;
}

type MatchFormProps = {
  initialData?: MatchFormData;
  teams: MatchTeamOption[];
  stadiums: MatchStadiumOption[];
  phases: MatchPhaseOption[];
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
  loading = false,
  error = null,
  onSubmit,
  onCancel,
}: MatchFormProps) {
  const { t } = useTranslation();

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

  const [validationError, setValidationError] =
    useState<string | null>(null);

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

    void onSubmit({
      visitor_team_id: visitor,
      home_team_id: home,
      match_date: matchDate,
      stadium_id: stadium,
      phase_id: phase,
      visitor_score: visitorRuns,
      home_score: homeRuns,
      audience: attendance,
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
          options={[
            {
              value: '',
              label: t('matches.selectVisitorTeam'),
            },
            ...teams.map((team) => ({
              value: team.team_id.toString(),
              label: team.name,
            })),
          ]}
        />

        <Select
          label={t('matches.homeTeam')}
          value={homeTeamId}
          onChange={(event) =>
            setHomeTeamId(event.target.value)
          }
          disabled={loading}
          options={[
            {
              value: '',
              label: t('matches.selectHomeTeam'),
            },
            ...teams.map((team) => ({
              value: team.team_id.toString(),
              label: team.name,
            })),
          ]}
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
