import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type esAuth from '@/locales/es/auth.json';

export function useApiErrorTranslation() {
  const { t } = useTranslation<'auth'>('auth');

  const translateApiError = useCallback((originalMessage: string | null | undefined) => {
    if (!originalMessage) {
      return null;
    }

    const trimmedMessage = originalMessage.trim();

    if (!trimmedMessage) {
      return null;
    }

    const normalizedMessage = trimmedMessage.replace(/\.$/, '');
    const authErrors = t('errors', { returnObjects: true }) as (typeof esAuth)['errors'];

    if (!authErrors || typeof authErrors !== 'object') {
      return null;
    }

    const directMatch = authErrors[normalizedMessage as keyof typeof authErrors];
    if (directMatch) {
      return directMatch;
    }

    const lowerCaseMessage = normalizedMessage.toLowerCase();
    for (const [key, value] of Object.entries(authErrors)) {
      if (lowerCaseMessage.includes(key.toLowerCase())) {
        return value;
      }
    }

    return null;
  }, [t]);

  return { translateApiError };
}
