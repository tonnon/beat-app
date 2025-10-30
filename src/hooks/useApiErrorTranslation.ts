import { useTranslation } from 'react-i18next';

export function useApiErrorTranslation() {
  const { i18n } = useTranslation('auth');

  const translateApiError = (errorMessage: string): string => {
    const sanitizedMessage = errorMessage.trim();
    const normalizedKey = sanitizedMessage.replace(/\.$/, '');

    const authResource = i18n.getResourceBundle(i18n.language, 'auth') as Record<string, unknown> | undefined;
    const errorSources = (
      authResource
        ? [
          (authResource.signupScreen as Record<string, unknown> | undefined)?.apiErrors,
          authResource.errors as Record<string, string> | undefined,
          (authResource.confirmEmail as Record<string, unknown> | undefined)?.errors,
          (authResource.informedConsent as Record<string, unknown> | undefined)?.errors,
        ]
        : []
    ).filter(Boolean) as Array<Record<string, string>>;

    for (const source of errorSources) {
      if (source[normalizedKey]) {
        return source[normalizedKey];
      }

      for (const possibleKey of Object.keys(source)) {
        if (sanitizedMessage.toLowerCase().includes(possibleKey.toLowerCase())) {
          return source[possibleKey];
        }
      }
    }

    return sanitizedMessage;
  };

  return { translateApiError };
}
