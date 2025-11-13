const isDevEnvironment = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);

const DEFAULT_API_BASE_URL = isDevEnvironment ? '' : 'https://api-beatapp.oleandrosantos.me';

const runtimeBaseUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
  ? String(import.meta.env.VITE_API_BASE_URL).trim()
  : undefined;

const API_BASE_URL = runtimeBaseUrl && runtimeBaseUrl.length > 0
  ? runtimeBaseUrl
  : DEFAULT_API_BASE_URL;

const API_PATHS = {
  avaibleLanguages: '/api/users/available-languages',
  selectedLanguage: '/api/users/set-language-preference',
  forgotPassword: '/api/users/forgot-password',
  login: '/api/users/login',
  me: '/api/users/me',
  confirmEmail: '/api/users/confirm-email',
  resendConfirmationEmail: '/api/users/resend-email-confirmation',
  register: '/api/users/register',
  checkEmail: '/api/users/check-email',
  checkCompanyCode: '/api/companies/check-code',
  cardSurveys: '/api/UserSurveyRounds/surveys',
  surveyQuestions: (surveyId: number | string) => `/api/surveys/${surveyId}/with-questions`,
  questionAnswer: '/api/surveys/questions/response',
  getAnswers: '/api/surveys/questions/response',
  editAnswer: '/api/surveys/questions/response',
} as const;

const resolveApiUrl = (path: string) => `${API_BASE_URL}${path}`;

export { DEFAULT_API_BASE_URL, API_BASE_URL, API_PATHS, resolveApiUrl };
