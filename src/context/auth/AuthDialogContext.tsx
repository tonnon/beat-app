import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface AuthDialogContextValue {
  readonly isOpen: boolean;
  readonly openDialog: () => void;
  readonly closeDialog: () => void;
  readonly setDialogOpen: (open: boolean) => void;
}

const AuthDialogContext = createContext<AuthDialogContextValue | undefined>(undefined);

type AuthDialogProviderProps = {
  readonly children: ReactNode;
};

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

export function useAuthDialog() {
  const context = useContext(AuthDialogContext);

  if (!context) {
    throw new Error('useAuthDialog must be used within an AuthDialogProvider');
  }

  return context;
}
