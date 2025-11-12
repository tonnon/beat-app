import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { API_PATHS } from '@/config/api';
import { useAuthStore } from '@/stores/authStore';

const SESSION_EXPIRED_STATUS = 401;
const API_PATH_PREFIX = '/api/';

type RequestInput = RequestInfo | URL;

type HeadersInitInput = HeadersInit | undefined;

interface UseApiFetchInterceptorsOptions {
  readonly onUnauthorized?: () => void;
}

const normalizeUrl = (input: RequestInput): string | null => {
  if (input instanceof Request) {
    return input.url ?? null;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return typeof input === 'string' && input.length > 0 ? input : null;
};

const toAbsoluteUrl = (input: string): URL | null => {
  try {
    if (typeof window !== 'undefined' && window.location) {
      return new URL(input, window.location.origin);
    }

    return new URL(input, 'http://localhost');
  } catch {
    return null;
  }
};

const isApiRequest = (input: RequestInput): boolean => {
  const candidate = normalizeUrl(input);

  if (!candidate) {
    return false;
  }

  const parsed = toAbsoluteUrl(candidate);

  if (!parsed) {
    return false;
  }

  return parsed.pathname.startsWith(API_PATH_PREFIX);
};

const isLoginRequest = (input: RequestInput): boolean => {
  const candidate = normalizeUrl(input);

  if (!candidate) {
    return false;
  }

  return candidate.includes(API_PATHS.login);
};

const mergeHeaders = (input: RequestInput, initHeaders: HeadersInitInput): Headers => {
  const headers = new Headers();

  if (input instanceof Request) {
    input.headers.forEach((value, key) => headers.append(key, value));
  }

  if (initHeaders) {
    const source = new Headers(initHeaders);
    source.forEach((value, key) => headers.set(key, value));
  }

  return headers;
};

const mapLanguageCode = (language: string | null | undefined): { primary: string; fallback: string } | null => {
  if (!language) {
    return null;
  }

  const normalized = language.trim().replace(/_/g, '-').toLowerCase();

  if (!normalized) {
    return null;
  }

  const canonicalMappings: Record<string, string> = {
    ca: 'es-ca',
    'ca-es': 'es-ca',
    'ca_es': 'es-ca',
    es: 'es-es',
    'es_ca': 'es-ca',
    'es-ca': 'es-ca',
  };

  const mapped = canonicalMappings[normalized] ?? normalized;
  const [base, region] = mapped.split('-');

  if (!base) {
    return null;
  }

  const finalRegion = region ? region.toUpperCase() : undefined;
  const primary = finalRegion ? `${base}-${finalRegion}` : base;

  return {
    primary,
    fallback: base,
  };
};

const buildAcceptLanguageHeader = (language: string | null | undefined): string | null => {
  const mapped = mapLanguageCode(language);

  if (!mapped) {
    return null;
  }

  if (mapped.primary.toLowerCase() === mapped.fallback.toLowerCase()) {
    return mapped.primary;
  }

  return `${mapped.primary},${mapped.fallback};q=0.8`;
};

export function useApiFetchInterceptors({ onUnauthorized }: UseApiFetchInterceptorsOptions = {}): void {
  const { i18n } = useTranslation();
  const userLanguage = useAuthStore((state) => state.user?.language ?? null);

  const acceptLanguageHeader = useMemo(
    () => buildAcceptLanguageHeader(userLanguage ?? i18n.language ?? null),
    [userLanguage, i18n.language],
  );

  useEffect(() => {
    if (typeof globalThis.fetch !== 'function') {
      return;
    }

    const originalFetch = globalThis.fetch.bind(globalThis);

    const interceptedFetch: typeof globalThis.fetch = async (input, init) => {
      let nextInit = init;

      if (acceptLanguageHeader && isApiRequest(input)) {
        const headers = mergeHeaders(input, init?.headers);

        if (!headers.has('Accept-Language')) {
          headers.set('Accept-Language', acceptLanguageHeader);
          nextInit = { ...init, headers };
        }
      }

      const response = await originalFetch(input as RequestInfo, nextInit);

      if (
        response.status === SESSION_EXPIRED_STATUS
        && !isLoginRequest(input)
        && useAuthStore.getState().accessToken
      ) {
        onUnauthorized?.();
      }

      return response;
    };

    Object.assign(interceptedFetch, originalFetch);
    globalThis.fetch = interceptedFetch;

    return () => {
      globalThis.fetch = originalFetch;
    };
  }, [acceptLanguageHeader, onUnauthorized]);
}
