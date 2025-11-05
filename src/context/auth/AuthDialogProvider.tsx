import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { AuthDialogContext, type AuthDialogContextValue } from './AuthDialogContext';

export interface AuthDialogProviderProps {
  readonly children: ReactNode;
}

export function AuthDialogProvider({ children }: AuthDialogProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setDialogOpen = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  const value = useMemo<AuthDialogContextValue>(() => ({
    isOpen,
    openDialog,
    closeDialog,
    setDialogOpen,
  }), [isOpen, openDialog, closeDialog, setDialogOpen]);

  return (
    <AuthDialogContext.Provider value={value}>{children}</AuthDialogContext.Provider>
  );
}
