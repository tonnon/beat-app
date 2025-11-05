import { FlagIcon, ChecklistIcon, EducationIcon, HeadCircuitIcon, CalendarIcon } from '@/components/icons/Icons';
import type { BottomNavbarItem } from './types';

export const DEFAULT_BOTTOM_NAVBAR_ITEMS: BottomNavbarItem[] = [
  { icon: FlagIcon, label: 'Daily', route: '/daily' },
  { icon: ChecklistIcon, label: 'Questionnaires', route: '/questionnaires' },
  { icon: EducationIcon, label: 'Education', route: '/education' },
  { icon: HeadCircuitIcon, label: 'Pratice', route: '/pratice' },
  { icon: CalendarIcon, label: 'Calendar', route: '/calendar' },
];
