import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  Layers3,
  LayoutDashboard,
  Shield,
  Star,
  Trophy,
  UserCog,
  UsersRound,
} from 'lucide-react';

export interface SidebarNavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export function getCompetitionNavigation(
  t: (key: string) => string,
): SidebarNavigationItem[] {
  return [
    {
      label: t('navigation.dashboard'),
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: t('navigation.teams'),
      path: '/teams',
      icon: Shield,
    },
    {
      label: t('navigation.players'),
      path: '/players',
      icon: UsersRound,
    },
    {
      label: t('navigation.coaches'),
      path: '/coaches',
      icon: UserCog,
    },
    {
      label: t('navigation.matches'),
      path: '/matches',
      icon: CalendarDays,
    },
    {
      label: t('navigation.stadiums'),
      path: '/stadiums',
      icon: Building2,
    },
    {
      label: t('navigation.phases'),
      path: '/phases',
      icon: Layers3,
    },
  ];
}

export function getReportsNavigation(
  t: (key: string) => string,
): SidebarNavigationItem[] {
  return [
    {
      label: t('navigation.reportStandings'),
      path: '/reports/standings',
      icon: Trophy,
    },
    {
      label: t('navigation.reportMatchesByTeams'),
      path: '/reports/matches-by-teams',
      icon: UsersRound,
    },
    {
      label: t('navigation.reportMatchesByDate'),
      path: '/reports/matches-by-date',
      icon: CalendarDays,
    },
    {
      label: t('navigation.reportTopCoaches'),
      path: '/reports/top-coaches',
      icon: UserCog,
    },
    {
      label: t('navigation.reportStadiumAttendance'),
      path: '/reports/stadium-attendance',
      icon: BarChart3,
    },
    {
      label: t('navigation.reportTeamStatus'),
      path: '/reports/team-status',
      icon: ClipboardList,
    },
    {
      label: t('navigation.reportAllStar'),
      path: '/reports/all-star',
      icon: Star,
    },
  ];
}
