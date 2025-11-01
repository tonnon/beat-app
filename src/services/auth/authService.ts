import { resolveApiUrl, API_PATHS } from '@/config/api';

const ERROR_RESPONSE_PROPERTIES = ['message', 'error', 'detail'] as const;

const HTTP_STATUS_FALLBACK_PREFIX = 'HTTP';

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const extractMessageFromPayload = (payload: unknown): string | null => {
  if (isNonEmptyString(payload)) {
    return payload.trim();
  }

  if (payload && typeof payload === 'object') {
    for (const key of ERROR_RESPONSE_PROPERTIES) {
      const candidate = (payload as Record<string, unknown>)[key];

      if (isNonEmptyString(candidate)) {
        return candidate.trim();
      }
    }
  }

  return null;
};

const extractErrorMessage = async (response: Response): Promise<string> => {
  try {
    const jsonPayload = await response.clone().json();
    const extracted = extractMessageFromPayload(jsonPayload);

    if (extracted) {
      return extracted;
    }
  } catch {
    
  }

  try {
    const textPayload = await response.clone().text();

    if (isNonEmptyString(textPayload)) {
      return textPayload.trim();
    }
  } catch {
    
  }

  const statusText = response.statusText?.trim();

  if (isNonEmptyString(statusText)) {
    return statusText;
  }

  return `${HTTP_STATUS_FALLBACK_PREFIX} ${response.status}`;
};

const ensureSuccessfulResponse = async (response: Response): Promise<Response> => {
  if (response.ok) {
    return response;
  }

  const message = await extractErrorMessage(response);

  throw new ApiError(message, message);
};

const mapToApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError(error.message, error.message);
  }

  return new ApiError(String(error), String(error));
};

export interface RegisterUserPayload {
  email: string;
  codeCompany: string;
  password: string;
  locale?: string;
}

export interface PasswordResetRequestPayload {
  email: string;
}

export async function requestPasswordReset(payload: PasswordResetRequestPayload): Promise<void> {
  const url = resolveApiUrl(API_PATHS.forgotPassword);

  try {
    await ensureSuccessfulResponse(await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }));
  } catch (error) {
    throw mapToApiError(error);
  }
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const url = resolveApiUrl(API_PATHS.login);

  try {
    const response = await ensureSuccessfulResponse(await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }));

    const rawResult = (await response.json()) as Partial<LoginResponse> & { token?: string };
    const accessToken = typeof rawResult.accessToken === 'string'
      ? rawResult.accessToken
      : typeof rawResult.token === 'string'
        ? rawResult.token
        : null;

    if (!accessToken) {
      throw new ApiError('Invalid response received from login endpoint');
    }

    return {
      accessToken,
      refreshToken: rawResult.refreshToken ?? null,
    } satisfies LoginResponse;
  } catch (error) {
    throw mapToApiError(error);
  }
}

export async function getAuthenticatedUser(token: string): Promise<AuthenticatedUser> {
  const url = resolveApiUrl(API_PATHS.me);

  try {
    const response = await ensureSuccessfulResponse(await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }));

    return response.json() as Promise<AuthenticatedUser>;
  } catch (error) {
    throw mapToApiError(error);
  }
}

export interface RegisterUserResponse {
  userId: string;
  email: string;
}

export interface ConfirmConsentPayload {
  userId: string;
  fullName: string;
  dni: string;
  birthDate?: string;
}

export interface ConfirmConsentResponse {
  success: boolean;
}

export interface ConfirmEmailPayload {
  email: string;
  code: string;
}

export interface ConfirmEmailResponse {
  success: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string | null;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  fullName?: string;
}

export class ApiError extends Error {
  public readonly originalMessage: string;

  constructor(message: string, originalMessage?: string) {
    super(message);
    this.name = 'ApiError';
    this.originalMessage = originalMessage || message;
  }
}

export async function confirmEmail(payload: ConfirmEmailPayload): Promise<ConfirmEmailResponse> {
  const url = resolveApiUrl(API_PATHS.confirmEmail);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await ensureSuccessfulResponse(await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }));

    const responseText = await response.text();

    if (!responseText.trim()) {
      return { success: true } satisfies ConfirmEmailResponse;
    }

    try {
      return JSON.parse(responseText) as ConfirmEmailResponse;
    } catch (parseError) {
      throw new ApiError('Invalid response received from email confirmation endpoint', responseText);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      const timeoutMessage = 'Email confirmation request timed out. Please try again.';
      throw new ApiError(timeoutMessage, timeoutMessage);
    }

    throw mapToApiError(error);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function registerUser(payload: RegisterUserPayload): Promise<RegisterUserResponse> {
  const url = resolveApiUrl(API_PATHS.register);
  
  try {
    const response = await ensureSuccessfulResponse(await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': payload.locale || 'es',
      },
      body: JSON.stringify(payload),
    }));

    return response.json();
  } catch (error) {
    throw mapToApiError(error);
  }
}

export async function confirmConsent(payload: ConfirmConsentPayload): Promise<ConfirmConsentResponse> {
  const url = resolveApiUrl(API_PATHS.confirmConsent);
  
  try {
    const response = await ensureSuccessfulResponse(await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }));

    return response.json();
  } catch (error) {
    throw mapToApiError(error);
  }
}
