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
    // Ignore JSON parsing errors and try alternative extraction strategies.
  }

  try {
    const textPayload = await response.clone().text();

    if (isNonEmptyString(textPayload)) {
      return textPayload.trim();
    }
  } catch {
    // Ignore text extraction failures; a fallback message will be provided.
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

const BOOLEAN_FALSE_PATTERNS: ReadonlyArray<RegExp> = [
  /^(false|no|0)$/i,
  /does\s+not\s+exist/i,
  /no\s+existe/i,
  /no\s+existeix/i,
  /not\s+found/i,
  /not\s+valid/i,
  /no\s+válido/i,
  /no\s+vàlid/i,
  /invalid/i,
  /inexistent/i,
  /inexistente/i,
];

const BOOLEAN_TRUE_PATTERNS: ReadonlyArray<RegExp> = [
  /^(true|yes|1)$/i,
  /already\s+exist/i,
  /ya\s+existe/i,
  /ja\s+existeix/i,
  /is\s+valid/i,
  /es\s+válido/i,
  /és\s+vàlid/i,
  /code\s+valid/i,
  /válido\s+el\s+código/i,
  /codi\s+vàlid/i,
];

const EMAIL_BOOLEAN_KEYS = ['exists', 'emailExists', 'isRegistered', 'emailAlreadyExists'] as const;
const COMPANY_BOOLEAN_KEYS = ['valid', 'isValid', 'exists', 'codeValid', 'companyExists'] as const;

export interface RegisterUserPayload {
  email: string;
  codeCompany: string;
  password: string;
  fullName: string;
  dni: string;
  birthDate?: string | null;
}

export async function checkCompanyCode(code: string, signal?: AbortSignal): Promise<boolean> {
  const url = `${resolveApiUrl(API_PATHS.checkCompanyCode)}?code=${encodeURIComponent(code)}&_=${Date.now()}`;

  try {
    const response = await fetch(url, { cache: 'no-store', signal });

    if (response.status === 404) {
      return false;
    }

    const successfulResponse = await ensureSuccessfulResponse(response);
    return parseCheckCompanyCodeResult(successfulResponse);
  } catch (error) {
    throw mapToApiError(error);
  }
}

export async function checkEmail(email: string, signal?: AbortSignal): Promise<void> {
  const url = `${resolveApiUrl(API_PATHS.checkEmail)}?email=${encodeURIComponent(email)}&_=${Date.now()}`;

  try {
    const response = await fetch(url, { cache: 'no-store', signal });
    const successfulResponse = await ensureSuccessfulResponse(response);
    const isAlreadyRegistered = await parseCheckEmailResult(successfulResponse);

    if (isAlreadyRegistered) {
      throw new ApiError('Email already exists', 'Email already exists');
    }
  } catch (error) {
    throw mapToApiError(error);
  }
}

async function parseCheckEmailResult(response: Response): Promise<boolean> {
  return parseBooleanResponse(response, EMAIL_BOOLEAN_KEYS);
}

async function parseCheckCompanyCodeResult(response: Response): Promise<boolean> {
  return parseBooleanResponse(response, COMPANY_BOOLEAN_KEYS);
}

async function parseBooleanResponse(response: Response, keys: readonly string[]): Promise<boolean> {
  const extract = (candidate: unknown) => extractBooleanFromCandidate(candidate, keys);

  try {
    const jsonPayload = await response.clone().json();
    const jsonResult = extract(jsonPayload);

    if (jsonResult !== null) {
      return jsonResult;
    }
  } catch {
    // Ignore JSON parsing errors and continue with alternative strategies.
  }

  try {
    const textPayload = (await response.clone().text()).trim();

    if (textPayload) {
      const textResult = normalizeBooleanString(textPayload);

      if (textResult !== null) {
        return textResult;
      }
    }
  } catch {
    // Ignore text parsing errors and return a safe default.
  }

  return false;
}

function extractBooleanFromCandidate(
  candidate: unknown,
  keys: readonly string[],
  visited: WeakSet<object> = new WeakSet(),
): boolean | null {
  const worklist: unknown[] = [candidate];

  while (worklist.length > 0) {
    const current = worklist.pop();

    if (current == null) {
      continue;
    }

    const currentType = typeof current;

    if (currentType === 'boolean') {
      return current as boolean;
    }

    if (currentType === 'string') {
      const parsed = normalizeBooleanString(current as string);

      if (parsed !== null) {
        return parsed;
      }

      continue;
    }

    if (currentType !== 'object') {
      continue;
    }

    const objectCandidate = current as object;

    if (visited.has(objectCandidate)) {
      continue;
    }

    visited.add(objectCandidate);

    const record = current as Record<string, unknown>;

    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(record, key)) {
        worklist.push(record[key]);
      }
    }

    for (const value of Object.values(record)) {
      worklist.push(value);
    }
  }

  return null;
}

function normalizeBooleanString(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  for (const pattern of BOOLEAN_FALSE_PATTERNS) {
    if (pattern.test(normalized)) {
      return false;
    }
  }

  for (const pattern of BOOLEAN_TRUE_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }

  return null;
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

export interface ConfirmEmailPayload {
  email: string;
  code: string;
}

export interface ConfirmEmailResponse {
  success: boolean;
}

export interface ResendConfirmationEmailPayload {
  email: string;
}

export interface ResendConfirmationEmailResponse {
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
    } catch {
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

export async function resendConfirmationEmail(
  payload: ResendConfirmationEmailPayload,
): Promise<ResendConfirmationEmailResponse> {
  const url = resolveApiUrl(API_PATHS.resendConfirmationEmail);

  try {
    const response = await ensureSuccessfulResponse(await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload.email),
    }));

    const responseText = await response.text();

    if (!responseText.trim()) {
      return { success: true } satisfies ResendConfirmationEmailResponse;
    }

    try {
      return JSON.parse(responseText) as ResendConfirmationEmailResponse;
    } catch {
      throw new ApiError('Invalid response received from resend confirmation endpoint', responseText);
    }
  } catch (error) {
    throw mapToApiError(error);
  }
}

export async function registerUser(payload: RegisterUserPayload): Promise<RegisterUserResponse> {
  const url = resolveApiUrl(API_PATHS.register);
  
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
