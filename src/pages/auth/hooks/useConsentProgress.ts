import { useCallback, useEffect, useMemo, useState, type MutableRefObject, type UIEvent } from 'react';
import {
  getScrollableViewKey,
  hasCompletedProgress,
  INITIAL_SCROLL_PROGRESS,
  SCROLL_COMPLETION_EPSILON,
  type AuthView,
  type ScrollableViewKey,
} from '../constants';

interface UseConsentProgressParams {
  readonly view: AuthView;
  readonly dialogBodyRef: MutableRefObject<HTMLDivElement | null>;
}

interface UseConsentProgressReturn {
  scrollProgress: Record<ScrollableViewKey, number>;
  handleDialogBodyScroll: (event: UIEvent<HTMLDivElement>) => void;
  resetScrollProgress: () => void;
  currentScrollableKey: ScrollableViewKey | null;
  currentProgressValue: number;
  termsDocumentCompleted: boolean;
  privacyDocumentCompleted: boolean;
  consentTextCompleted: boolean;
  readingCompleted: boolean;
}

export function useConsentProgress({ view, dialogBodyRef }: UseConsentProgressParams): UseConsentProgressReturn {
  const [scrollProgress, setScrollProgress] = useState<Record<ScrollableViewKey, number>>(INITIAL_SCROLL_PROGRESS);

  const handleDialogBodyScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const scrollableKey = getScrollableViewKey(view);

    if (!scrollableKey) {
      return;
    }

    const target = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const maximumScrollable = scrollHeight - clientHeight;

    if (maximumScrollable <= SCROLL_COMPLETION_EPSILON) {
      setScrollProgress((previous) => {
        if (previous[scrollableKey] === 100) {
          return previous;
        }

        return {
          ...previous,
          [scrollableKey]: 100,
        };
      });
      return;
    }

    const isAtBottom = maximumScrollable - scrollTop <= SCROLL_COMPLETION_EPSILON;
    const rawProgress = (scrollTop / maximumScrollable) * 100;
    const nextProgress = isAtBottom ? 100 : Math.min(100, Math.max(0, rawProgress));

    setScrollProgress((previous) => {
      const currentProgress = previous[scrollableKey] ?? 0;

      if (hasCompletedProgress(currentProgress) && nextProgress < currentProgress) {
        return previous;
      }

      if (Math.abs(currentProgress - nextProgress) < 0.1) {
        return previous;
      }

      const updatedProgress = Math.max(currentProgress, nextProgress);

      if (updatedProgress === currentProgress) {
        return previous;
      }

      return {
        ...previous,
        [scrollableKey]: updatedProgress,
      };
    });
  }, [view]);

  useEffect(() => {
    const key = getScrollableViewKey(view);
    const body = dialogBodyRef.current;

    if (!key || !body) {
      return;
    }

    body.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

    if (body.scrollHeight <= body.clientHeight) {
      setScrollProgress((previous) => {
        if (previous[key] === 100) {
          return previous;
        }

        return {
          ...previous,
          [key]: 100,
        };
      });
    }
  }, [view, dialogBodyRef]);

  const resetScrollProgress = useCallback(() => {
    setScrollProgress(INITIAL_SCROLL_PROGRESS);
  }, []);

  const currentScrollableKey = useMemo(() => getScrollableViewKey(view), [view]);

  const currentProgressValue = useMemo(() => {
    if (!currentScrollableKey) {
      return 0;
    }

    const value = scrollProgress[currentScrollableKey] ?? 0;

    return Math.min(100, Math.max(0, value));
  }, [currentScrollableKey, scrollProgress]);

  const termsDocumentCompleted = useMemo(
    () => hasCompletedProgress(scrollProgress.termsOfUse),
    [scrollProgress.termsOfUse],
  );

  const privacyDocumentCompleted = useMemo(
    () => hasCompletedProgress(scrollProgress.privacyPolicy),
    [scrollProgress.privacyPolicy],
  );

  const consentTextCompleted = useMemo(
    () => hasCompletedProgress(scrollProgress.informedConsentText),
    [scrollProgress.informedConsentText],
  );

  const readingCompleted = useMemo(
    () => termsDocumentCompleted && privacyDocumentCompleted && consentTextCompleted,
    [consentTextCompleted, privacyDocumentCompleted, termsDocumentCompleted],
  );

  return {
    scrollProgress,
    handleDialogBodyScroll,
    resetScrollProgress,
    currentScrollableKey,
    currentProgressValue,
    termsDocumentCompleted,
    privacyDocumentCompleted,
    consentTextCompleted,
    readingCompleted,
  };
}
