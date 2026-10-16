import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getTopCoaches } from '../api/top-coaches';
import type { TopCoach } from '../types/top-coach';
import DataTable from '../components/ui/DataTable';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { EmptyState } from '../components/ui/EmptyState';
import { getApiErrorMessage } from '../api/api-error';
import './TopCoachesPage.css';
import { PdfDownloadButton } from '../components/ui/PdfDownloadButton';
import EmailReportButton from '../components/ui/EmailReportButton';

export function TopCoachesPage() {
  const { t } = useTranslation();

  const [coaches, setCoaches] = useState<TopCoach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTopCoaches() {
      setLoading(true);
      setError(null);

      try {
        const data = await getTopCoaches();

        if (active) {
          setCoaches(data);
        }
      } catch (err) {
        if (active) {
          setError(
            getApiErrorMessage(
              err,
              t('topCoaches.loadError'),
            ),
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTopCoaches();

    return () => {
      active = false;
    };
  }, [t]);

  const coachesByTeam = useMemo(() => {
    const groups = new Map<string, TopCoach[]>();

    for (const coach of coaches) {
      const current = groups.get(coach.team_name) ?? [];
      current.push(coach);
      groups.set(coach.team_name, current);
    }

    return Array.from(groups.entries()).sort(
      ([teamA], [teamB]) =>
        teamA.localeCompare(teamB, 'es', {
          sensitivity: 'base',
        }),
    );
  }, [coaches]);

  const columns = [
    {
      key: 'position',
      header: t('topCoaches.position'),
      render: (_coach: TopCoach, index: number) => (
        <span className="top-coaches-position">
          {index + 1}
        </span>
      ),
    },
    {
      key: 'coach',
      header: t('topCoaches.coach'),
      render: (coach: TopCoach) => (
        <span className="top-coaches-name">
          {coach.coach_name}
        </span>
      ),
    },
    {
      key: 'number',
      header: t('topCoaches.number'),
      render: (coach: TopCoach) => (
        <span className="top-coaches-number">
          #{coach.jersey_number}
        </span>
      ),
    },
    {
      key: 'experience',
      header: t('topCoaches.experience'),
      render: (coach: TopCoach) =>
        `${coach.years_experience} ${
          coach.years_experience === 1
            ? t('topCoaches.year')
            : t('topCoaches.years')
        }`,
    },
  ];

  return (
    <section className="top-coaches-page">
      <PageHeader
        eyebrow={t('topCoaches.eyebrow')}
        title={t('topCoaches.title')}
        description={t('topCoaches.description')}
      />

      {loading && (
        <LoadingState
          message={t('topCoaches.loading')}
        />
      )}

      {!loading && error && (
        <ErrorMessage message={error} />
      )}

      {!loading && !error && coaches.length === 0 && (
        <EmptyState
          title={t('topCoaches.emptyTitle')}
          description={t('topCoaches.emptyDescription')}
        />
      )}

      {!loading && !error && coaches.length > 0 && (
        <>
          <div className="report-actions">
            <PdfDownloadButton
              endpoint="/reports/pdf/top-coaches"
              filename="entrenadores-con-mas-experiencia.pdf"
            />
            <EmailReportButton report="top-coaches" />
          </div>

          <div className="top-coaches-groups">
          {coachesByTeam.map(([teamName, teamCoaches]) => (
            <section
              className="top-coaches-team"
              key={teamName}
            >
              <div className="top-coaches-team-header">
                <h2>{teamName}</h2>
              </div>

              <DataTable
                columns={columns}
                data={teamCoaches}
                getRowKey={(coach: TopCoach) =>
                  `${coach.team_name}-${coach.jersey_number}`
                }
              />
            </section>
          ))}
          </div>
        </>
      )}
    </section>
  );
}
