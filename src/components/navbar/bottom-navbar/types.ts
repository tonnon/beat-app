import type { MouseEvent } from 'react';
import type { IconType } from 'react-icons';

export type BottomNavbarItem = {
  icon: IconType;
  label?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  route?: string;
};
