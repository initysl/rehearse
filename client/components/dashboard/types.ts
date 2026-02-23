import type { IconType } from 'react-icons';

export type DashboardView =
  | 'scenario-browser'
  | 'session-setup'
  | 'conversation'
  | 'feedback'
  | 'history-profile';

export type DashboardNavItem = {
  view: DashboardView;
  label: string;
  icon: IconType;
  description: string;
};

export type ScenarioCategoryFilter =
  | 'all'
  | 'work'
  | 'health'
  | 'family'
  | 'social'
  | 'financial'
  | 'legal';
