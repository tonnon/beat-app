import { create } from 'zustand';
import type { AuthView } from '@/pages/auth/constants';

type ConfirmEmailFlowParams = {
  readonly email: string;
  readonly code: string;
  readonly autoConfirm: boolean;
};

interface AuthDialogFlowState {
  readonly targetView: AuthView | null;
  readonly confirmEmailParams: ConfirmEmailFlowParams | null;
  setConfirmEmailFlow: (payload: { email: string; code: string; autoConfirm?: boolean }) => void;
  consumeConfirmEmailFlow: () => void;
}

export const useAuthDialogFlowStore = create<AuthDialogFlowState>((set) => ({
  targetView: null,
  confirmEmailParams: null,
  setConfirmEmailFlow: ({ email, code, autoConfirm = false }) => set({
    targetView: 'confirmEmail',
    confirmEmailParams: {
      email: email.trim(),
      code: code.trim(),
      autoConfirm,
    },
  }),
  consumeConfirmEmailFlow: () => set({
    targetView: null,
    confirmEmailParams: null,
  }),
}));
