import { lazy, Suspense } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { AuthProvider } from './auth/auth-provider';
import { ProtectedRoute } from './auth/protected-route';
import { RoleProtectedRoute } from './auth/role-protected-route';
import { AppLayout } from './components/layout/AppLayout';

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
);

const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((module) => ({
    default: module.LoginPage,
  })),
);

const ModulePlaceholderPage = lazy(() =>
  import('./pages/ModulePlaceholderPage').then((module) => ({
    default: module.ModulePlaceholderPage,
  })),
);

const PlayersPage = lazy(() => import('./pages/PlayersPage'));

const TeamsPage = lazy(() =>
  import('./pages/TeamsPage').then((module) => ({
    default: module.TeamsPage,
  })),
);

const StadiumsPage = lazy(() => import('./pages/StadiumsPage'));
const PhasesPage = lazy(() => import('./pages/PhasesPage'));
const MatchesPage = lazy(() => import('./pages/MatchesPage'));
const CoachesPage = lazy(() => import('./pages/CoachesPage'));

const StandingsPage = lazy(() =>
  import('./pages/StandingsPage').then((module) => ({
    default: module.StandingsPage,
  })),
);

const MatchesByTeamsPage = lazy(() =>
  import('./pages/MatchesByTeamsPage').then((module) => ({
    default: module.MatchesByTeamsPage,
  })),
);

const MatchesByDatePage = lazy(() =>
  import('./pages/MatchesByDatePage').then((module) => ({
    default: module.MatchesByDatePage,
  })),
);

const TopCoachesPage = lazy(() =>
  import('./pages/TopCoachesPage').then((module) => ({
    default: module.TopCoachesPage,
  })),
);

const StadiumAttendancePage = lazy(() =>
  import('./pages/StadiumAttendancePage').then((module) => ({
    default: module.StadiumAttendancePage,
  })),
);

const TeamStatusPage = lazy(() =>
  import('./pages/TeamStatusPage').then((module) => ({
    default: module.TeamStatusPage,
  })),
);

const AllStarTeamPage = lazy(() =>
  import('./pages/AllStarTeamPage').then((module) => ({
    default: module.AllStarTeamPage,
  })),
);

const UsersPage = lazy(() => import('./pages/UsersPage'));

const ForbiddenPage = lazy(() =>
  import('./pages/ForbiddenPage').then((module) => ({
    default: module.ForbiddenPage,
  })),
);

const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((module) => ({
    default: module.NotFoundPage,
  })),
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route
              path="/login"
              element={<LoginPage />}
            />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />

                <Route
                  path="/dashboard"
                  element={<DashboardPage />}
                />

                <Route
                  path="/teams"
                  element={<TeamsPage />}
                />

                <Route
                  path="/players"
                  element={<PlayersPage />}
                />

                <Route
                  path="/coaches"
                  element={<CoachesPage />}
                />

                <Route
                  path="/matches"
                  element={<MatchesPage />}
                />

                <Route
                  path="/stadiums"
                  element={<StadiumsPage />}
                />

                <Route
                  path="/phases"
                  element={<PhasesPage />}
                />

                <Route
                  path="/reports/standings"
                  element={<StandingsPage />}
                />

                <Route
                  path="/reports/matches-by-teams"
                  element={<MatchesByTeamsPage />}
                />

                <Route
                  path="/reports/matches-by-date"
                  element={<MatchesByDatePage />}
                />

                <Route
                  path="/reports/top-coaches"
                  element={<TopCoachesPage />}
                />

                <Route
                  path="/reports/stadium-attendance"
                  element={<StadiumAttendancePage />}
                />

                <Route
                  path="/reports/team-status"
                  element={<TeamStatusPage />}
                />

                <Route
                  path="/reports/all-star"
                  element={<AllStarTeamPage />}
                />

                <Route
                  path="/reports"
                  element={
                    <ModulePlaceholderPage
                      eyebrow="Análisis"
                      title="Reportes"
                      description="Aquí reuniremos los siete reportes requeridos por el proyecto."
                    />
                  }
                />

                <Route element={<RoleProtectedRoute allowedRoles={['Administrator']} />}>
                  <Route
                    path="/users"
                    element={<UsersPage />}
                  />
                </Route>
              </Route>
            </Route>

            <Route
              path="/forbidden"
              element={<ForbiddenPage />}
            />

            <Route
              path="*"
              element={<NotFoundPage />}
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
