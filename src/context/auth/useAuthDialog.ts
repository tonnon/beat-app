import { useContext } from 'react';
import { AuthDialogContext } from './AuthDialogContext';

export function useAuthDialog() {
  const context = useContext(AuthDialogContext);

  if (!context) {
    throw new Error('useAuthDialog must be used within an AuthDialogProvider');
  }

  return context;
}
