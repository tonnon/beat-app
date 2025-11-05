import { createContext } from 'react';

export interface AuthDialogContextValue {
  readonly isOpen: boolean;
  readonly openDialog: () => void;
  readonly closeDialog: () => void;
  readonly setDialogOpen: (open: boolean) => void;
}

export const AuthDialogContext = createContext<AuthDialogContextValue | undefined>(undefined);
