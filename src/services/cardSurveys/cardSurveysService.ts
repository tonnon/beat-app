import { API_PATHS, resolveApiUrl } from '@/config/api';
import { ApiError } from '@/services/auth/authService';

const ERROR_RESPONSE_KEYS = ['message', 'error', 'detail'] as const;

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const extractErrorMessage = async (response: Response): Promise<string | null> => {
  try {
    const payload = await response.clone().json() as Record<string, unknown>;

    for (const key of ERROR_RESPONSE_KEYS) {
      const candidate = payload?.[key];

      if (isNonEmptyString(candidate)) {
        return candidate.trim();
      }
    }
  } catch {
    // Ignore JSON parsing errors and continue with alternative strategies.
  }

  try {
    const textPayload = await response.clone().text();

    if (isNonEmptyString(textPayload)) {
      return textPayload.trim();
    }
  } catch {
    // Ignore text extraction failures and return null so a fallback message can be used.
  }

  return null;
};

const ensureSuccessfulResponse = async (response: Response): Promise<Response> => {
  if (response.ok) {
    return response;
  }

  const message = await extractErrorMessage(response);
  const fallback = `Request failed with status ${response.status}`;

  throw new ApiError(message ?? fallback, message ?? fallback);
};

export interface CardSurveyTranslation {
  readonly language: string;
  readonly title: string | null;
  readonly description: string | null;
}

export interface CardSurvey {
  readonly id: number;
  readonly code: string;
  readonly colorHex: string | null;
  readonly translations: ReadonlyArray<CardSurveyTranslation> | null;
  readonly totalQuestions: number;
  readonly answeredQuestionsCount: number;
  readonly status: string;
  readonly completionPercentage: number;
}

export interface CardSurveyRound {
  readonly id: number;
  readonly name: string;
  readonly idUserSurveyRound: number;
  readonly userSurvey: ReadonlyArray<CardSurvey> | null;
}

export interface CardSurveysResponse {
  readonly rounds: ReadonlyArray<CardSurveyRound> | null;
}

export interface SurveyAnswerOptionTranslation {
  readonly language: string;
  readonly text: string | null;
}

export interface SurveyAnswerOption {
  readonly id: number;
  readonly orderIndex: number;
  readonly translations: ReadonlyArray<SurveyAnswerOptionTranslation> | null;
}

export interface SurveyQuestionTranslation {
  readonly language: string;
  readonly pretitle: string | null;
  readonly title: string | null;
  readonly helpText: string | null;
  readonly responseTemplate: string | null;
}

export interface SurveyQuestion {
  readonly id: number;
  readonly orderIndex: number;
  readonly type: string;
  readonly translations: ReadonlyArray<SurveyQuestionTranslation> | null;
  readonly questionTranslations?: ReadonlyArray<SurveyQuestionTranslation> | null;
  readonly answerOptions: ReadonlyArray<SurveyAnswerOption> | null;
  readonly anwserOptions?: ReadonlyArray<SurveyAnswerOption> | null;
}

export interface SurveyQuestionAnswer {
  readonly questionId: number;
  readonly answerOptionId: number | null;
  readonly text?: string | null;
  readonly responseText?: string | null;
}

export interface SurveyWithQuestions {
  readonly id: number;
  readonly code: string;
  readonly colorHex: string | null;
  readonly translations: ReadonlyArray<CardSurveyTranslation> | null;
  readonly questions: ReadonlyArray<SurveyQuestion> | null;
}

export interface SurveyWithQuestionAnswers extends SurveyWithQuestions {
  readonly answers: ReadonlyArray<SurveyQuestionAnswer> | null;
}

export interface QuestionAnswerPayload {
  readonly questionId: number;
  readonly answerOptionId: number | null;
  readonly userSurveyRoundId: number;
  readonly responseText: string | null;
}

export async function fetchCardSurveys(token: string, signal?: AbortSignal): Promise<CardSurveysResponse> {
  const url = resolveApiUrl(API_PATHS.cardSurveys);

  try {
    if (!token) {
      throw new ApiError('Authentication token is required to fetch card surveys', 'Authentication token is required to fetch card surveys');
    }

    const response = await ensureSuccessfulResponse(await fetch(url, {
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }));
    return response.json() as Promise<CardSurveysResponse>;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new ApiError(error.message, error.message);
    }

    throw new ApiError('Unknown error occurred while fetching card surveys', String(error));
  }
}

export async function fetchSurveyWithQuestions(
  surveyId: number | string,
  token: string,
  signal?: AbortSignal,
): Promise<SurveyWithQuestionAnswers> {
  const url = resolveApiUrl(API_PATHS.surveyQuestions(surveyId));

  try {
    if (!token) {
      throw new ApiError('Authentication token is required to fetch survey questions', 'Authentication token is required to fetch survey questions');
    }

    const response = await ensureSuccessfulResponse(await fetch(url, {
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }));

    return response.json() as Promise<SurveyWithQuestionAnswers>;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new ApiError(error.message, error.message);
    }

    throw new ApiError('Unknown error occurred while fetching survey questions', String(error));
  }
}

export async function submitQuestionAnswer(token: string, payload: QuestionAnswerPayload, signal?: AbortSignal): Promise<void> {
  const url = resolveApiUrl(API_PATHS.questionAnswer);

  try {
    const trimmedToken = token?.trim() ?? '';

    if (!trimmedToken) {
      throw new ApiError('Authentication token is required to submit question answers', 'Authentication token is required to submit question answers');
    }

    const response = await ensureSuccessfulResponse(await fetch(url, {
      method: 'POST',
      signal,
      headers: {
        Authorization: `Bearer ${trimmedToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }));

    if (response.status !== 204) {
      await response.text().catch(() => null);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new ApiError(error.message, error.message);
    }

    throw new ApiError('Unknown error occurred while submitting question answer', String(error));
  }
}
