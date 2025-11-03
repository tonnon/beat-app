export type AuthView =
  | 'login'
  | 'forgotPassword'
  | 'signup'
  | 'termsOfUse'
  | 'privacyPolicy'
  | 'informedConsent'
  | 'informedConsentText'
  | 'confirmEmail'
  | 'signupSuccess';

export type ScrollableViewKey = 'termsOfUse' | 'privacyPolicy' | 'informedConsentText';

export const INITIAL_SCROLL_PROGRESS: Record<ScrollableViewKey, number> = {
  termsOfUse: 0,
  privacyPolicy: 0,
  informedConsentText: 0,
};

export const PROGRESS_COMPLETE_THRESHOLD = 99;
export const SCROLL_COMPLETION_EPSILON = 1;

export const hasCompletedProgress = (progress: number) => progress >= PROGRESS_COMPLETE_THRESHOLD;

export const getScrollableViewKey = (view: AuthView): ScrollableViewKey | null => {
  if (view === 'termsOfUse' || view === 'privacyPolicy' || view === 'informedConsentText') {
    return view;
  }

  return null;
};
