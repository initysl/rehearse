import {
  FiActivity,
  FiBookOpen,
  FiEdit3,
  FiMessageSquare,
  FiPieChart,
} from 'react-icons/fi';
import type { DashboardNavItem } from './types';

export const dashboardNavItems: DashboardNavItem[] = [
  {
    view: 'scenario-browser',
    label: 'Scenarios',
    icon: FiBookOpen,
    description: 'Browse and filter practice scenarios',
  },
  {
    view: 'session-setup',
    label: 'Session Setup',
    icon: FiEdit3,
    description: 'Configure your next rehearsal',
  },
  {
    view: 'conversation',
    label: 'Conversation',
    icon: FiMessageSquare,
    description: 'Live AI conversation workspace',
  },
  {
    view: 'feedback',
    label: 'Feedback',
    icon: FiPieChart,
    description: 'Review structured coaching results',
  },
  {
    view: 'history-profile',
    label: 'History',
    icon: FiActivity,
    description: 'Profile, progress and session timeline',
  },
];
