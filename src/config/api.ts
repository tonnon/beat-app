const isBrowserEnvironment = typeof window !== 'undefined';

const DEFAULT_API_BASE_URL = isBrowserEnvironment ? '' : 'https://api-beatapp.oleandrosantos.me';

const runtimeBaseUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL
  : undefined;

const devBaseUrl = typeof import.meta !== 'undefined' && import.meta.env?.DEV ? '' : undefined;

const API_BASE_URL = runtimeBaseUrl ?? devBaseUrl ?? DEFAULT_API_BASE_URL;

const API_PATHS = {
  forgotPassword: '/api/users/forgot-password',
  login: '/api/users/login',
  me: '/api/users/me',
  confirmEmail: '/api/users/confirm-email',
  register: '/api/users/register',
  checkEmail: '/api/users/check-email',
} as const;

const resolveApiUrl = (path: string) => `${API_BASE_URL}${path}`;

export { DEFAULT_API_BASE_URL, API_BASE_URL, API_PATHS, resolveApiUrl };
