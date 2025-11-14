import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/layout/page-layout/page-header/PageHeader';
import Skeleton from '@/components/skeleton/Skeleton';
import Dropdown from '@/components/dropdown/Dropdown';
import type { DropdownItem } from '@/components/dropdown/Dropdown';
import StatusBadge from '@/components/status-badge/StatusBadge';
import QuestionnaireGrid from '@/layout/card-grid/CardGrid';
import Tab from '@/components/tab/Tab';
import type { TabItem } from '@/components/tab/Tab';
import type { CardModel, CardStatus } from '@/components/card/Card';
import Dialog from '@/components/dialog/Dialog';
import Button from '@/components/button/Button';
import Warning from '@/components/warning/Warning';
import { ArrowLeftIcon } from '@/components/icons/Icons';
import SurveyQuestionStep, { SurveyQuestionSkeleton } from './questions/Questions';
import useNormalizedTranslation from '@/hooks/useNormalizedTranslation';
import {
  fetchCardSurveys,
  fetchSurveyAnswers,
  fetchSurveyWithQuestions,
  submitQuestionAnswer,
  updateQuestionAnswer,
} from '@/services/cardSurveys/cardSurveysService';
import type {
  CardSurvey,
  CardSurveyTranslation,
  SurveyQuestion,
  SurveyQuestionAnswer,
  SurveyWithQuestionAnswers,
} from '@/services/cardSurveys/cardSurveysService';
import { ApiError } from '@/services/auth/authService';
import { useAuthStore } from '@/stores/authStore';
import { normalizeQuestionType, resolveQuestionTitle } from './questions/questionUtils';

type StatusFilterValue = 'all' | CardStatus;
type QuestionnaireStatusKey = `statuses.${CardStatus}`;
type QuestionnaireFilterKey =
  | 'filters.all'
  | 'filters.completed'
  | 'filters.in_progress'
  | 'filters.not_started';
type QuestionnaireActionKey =
  | 'actions.responses'
  | 'actions.continue'
  | 'actions.start'
  | 'actions.back'
  | 'actions.close'
  | 'actions.retry';
type QuestionnairesHeaderKey =
  | 'header.back'
  | 'header.title'
  | 'header.subtitle';
type QuestionnairesEmptyKey = 'empty.title' | 'empty.description';
type QuestionnairesDialogKey =
  | 'dialog.title'
  | 'dialog.subtitle'
  | 'dialog.loading'
  | 'dialog.error'
  | 'dialog.step';

const STATUS_TRANSLATION_KEYS: Record<CardStatus, QuestionnaireStatusKey> = {
  completed: 'statuses.completed',
  in_progress: 'statuses.in_progress',
  not_started: 'statuses.not_started',
} as const;

const FILTER_TRANSLATION_KEYS: Record<Exclude<StatusFilterValue, 'all'>, QuestionnaireFilterKey> = {
  completed: 'filters.completed',
  in_progress: 'filters.in_progress',
  not_started: 'filters.not_started',
} as const;

const getStatusTranslationKey = (status: CardStatus): QuestionnaireStatusKey =>
  STATUS_TRANSLATION_KEYS[status];

const getFilterTranslationKey = (status: StatusFilterValue): QuestionnaireFilterKey =>
  status === 'all' ? 'filters.all' : FILTER_TRANSLATION_KEYS[status];

const STATUS_ORDER = ['all', 'completed', 'in_progress', 'not_started'] as const satisfies ReadonlyArray<StatusFilterValue>;

const clampProgress = (value: number | null | undefined): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 100);
};

const resolveCardStatus = (status: string | null | undefined): CardStatus => {
  if (status === 'completed') {
    return 'completed';
  }

  if (status === 'in_progress') {
    return 'in_progress';
  }

  return 'not_started';
};

const normalizeLanguage = (language: string | null | undefined): string | null => {
  if (!language) {
    return null;
  }

  return language.trim().replace(/_/g, '-').toLowerCase();
};

const matchesLanguage = (candidate: string | null | undefined, language: string): boolean => {
  const normalizedCandidate = normalizeLanguage(candidate);

  if (!normalizedCandidate) {
    return false;
  }

  if (normalizedCandidate.startsWith(language)) {
    return true;
  }

  return normalizedCandidate.split('-').some((part) => part === language);
};

type NormalizeTranslationFn = (value: string | null | undefined) => string;

const resolveSurveyTitle = (survey: CardSurvey, language: string, normalizeText: NormalizeTranslationFn): string => {
  const translations = survey.translations ?? [];

  if (!translations.length) {
    return normalizeText(survey.code);
  }

  const normalizedLanguage = normalizeLanguage(language);
  const languageWithoutRegion = normalizedLanguage?.split('-')[0] ?? null;

  const candidates = translations.filter((translation) => isNonEmptyTranslationTitle(translation.title));

  if (!candidates.length) {
    return normalizeText(survey.code);
  }

  if (normalizedLanguage) {
    const exactMatch = candidates.find((translation) => normalizeLanguage(translation.language) === normalizedLanguage);

    if (exactMatch) {
      return normalizeText(exactMatch.title);
    }
  }

  if (languageWithoutRegion) {
    const partialMatch = candidates.find((translation) => matchesLanguage(translation.language, languageWithoutRegion));

    if (partialMatch) {
      return normalizeText(partialMatch.title);
    }
  }

  return normalizeText(candidates[0].title);
};

const isNonEmptyTranslationTitle = (title: string | null | undefined): title is string =>
  typeof title === 'string' && title.trim().length > 0;

const DEFAULT_FETCH_ERROR_MESSAGE = 'Unable to load questionnaires.';

const resolveSurveyDialogTitle = (
  code: string,
  translationsInput: ReadonlyArray<CardSurveyTranslation> | null | undefined,
  language: string,
  normalizeText: NormalizeTranslationFn,
): string => {
  if (!code) {
    return '';
  }

  const translations = translationsInput ?? [];

  if (!translations.length) {
    return normalizeText(code);
  }

  const normalizedLanguage = normalizeLanguage(language);
  const languageWithoutRegion = normalizedLanguage?.split('-')[0] ?? null;
  const candidates = translations.filter((translation) => isNonEmptyTranslationTitle(translation.title));

  if (!candidates.length) {
    return normalizeText(code);
  }

  if (normalizedLanguage) {
    const exactMatch = candidates.find((translation) => normalizeLanguage(translation.language) === normalizedLanguage);

    if (exactMatch?.title) {
      return normalizeText(exactMatch.title);
    }
  }

  if (languageWithoutRegion) {
    const partialMatch = candidates.find((translation) => matchesLanguage(translation.language, languageWithoutRegion));

    if (partialMatch?.title) {
      return normalizeText(partialMatch.title);
    }
  }

  const fallbackTitle = candidates[0]?.title;
  return fallbackTitle ? normalizeText(fallbackTitle) : normalizeText(code);
};

const sortSurveyQuestions = (questionsInput: ReadonlyArray<SurveyQuestion> | null | undefined): SurveyQuestion[] => {
  if (!questionsInput) {
    return [];
  }

  return [...questionsInput].sort((a, b) => {
    const aOrder = typeof a.orderIndex === 'number' ? a.orderIndex : Number.MAX_SAFE_INTEGER;
    const bOrder = typeof b.orderIndex === 'number' ? b.orderIndex : Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return a.id - b.id;
  });
};

const clampQuestionIndex = (index: number, total: number): number => {
  if (total <= 0) {
    return -1;
  }

  if (index < 0) {
    return 0;
  }

  if (index >= total) {
    return total - 1;
  }

  return index;
};

export default function QuestionnairesPage() {
  const { t, i18n } = useTranslation(['questionnaires', 'common']);
  const normalizeTranslation = useNormalizedTranslation();
  const currentLanguage = i18n.resolvedLanguage ?? i18n.language;
  const accessToken = useAuthStore((state) => state.accessToken);
  const userPreferredLanguage = useAuthStore((state) => state.user?.language ?? null);
  const lastFetchedTokenRef = useRef<string | null>(null);
  const hasSkippedStrictModeEffectRef = useRef(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [surveys, setSurveys] = useState<ReadonlyArray<CardSurvey>>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSurveyDialogOpen, setIsSurveyDialogOpen] = useState(false);
  const [isSurveyDialogLoading, setIsSurveyDialogLoading] = useState(false);
  const [surveyDialogError, setSurveyDialogError] = useState<string | null>(null);
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null);
  const [activeSurveyData, setActiveSurveyData] = useState<SurveyWithQuestionAnswers | null>(null);
  const [roundName, setRoundName] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeSurveyTitle, setActiveSurveyTitle] = useState('');
  const [activeSurveyQuestions, setActiveSurveyQuestions] = useState<ReadonlyArray<SurveyQuestion>>([]);
  const [questionAnswers, setQuestionAnswers] = useState<Record<number, Date | number | string | null>>({});
  const [persistedAnswerLookup, setPersistedAnswerLookup] = useState<Record<number, true>>({});
  const submitAnswerAbortControllerRef = useRef<AbortController | null>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [submitAnswerError, setSubmitAnswerError] = useState<string | null>(null);
  const [userSurveyRoundId, setUserSurveyRoundId] = useState<number | null>(null);
  const surveyDialogAbortControllerRef = useRef<AbortController | null>(null);
  const [tabValue, setTabValue] = useState<string>('t0');
  const [localSurveyProgress, setLocalSurveyProgress] = useState<Record<string, number>>({});
  const [localSurveyStatus, setLocalSurveyStatus] = useState<Record<string, CardStatus>>({});
  const questionLanguageFallbacks = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];

    const register = (candidate: string | null | undefined) => {
      const normalized = normalizeLanguage(candidate);

      if (!normalized || seen.has(normalized)) {
        return;
      }

      seen.add(normalized);
      result.push(normalized);
    };

    register(userPreferredLanguage);

    const normalizedPreferred = normalizeLanguage(userPreferredLanguage);

    if (normalizedPreferred) {
      for (const segment of normalizedPreferred.split('-')) {
        register(segment);
      }
    }

    return result;
  }, [userPreferredLanguage]);

  const clearSurveyDialogRequest = useCallback(() => {
    const controller = surveyDialogAbortControllerRef.current;

    if (controller) {
      controller.abort();
      surveyDialogAbortControllerRef.current = null;
    }
  }, []);

  const clearSubmitAnswerRequest = useCallback(() => {
    const controller = submitAnswerAbortControllerRef.current;

    if (controller) {
      controller.abort();
      submitAnswerAbortControllerRef.current = null;
    }
  }, []);

  const loadSurveyQuestions = useCallback((surveyId: string) => {
    const token = accessToken?.trim() ?? '';

    if (!surveyId) {
      return;
    }

    clearSurveyDialogRequest();
    clearSubmitAnswerRequest();
    setIsSubmittingAnswer(false);
    setSubmitAnswerError(null);

    if (!token) {
      setIsSurveyDialogLoading(false);
      setSurveyDialogError(t('dialog.error' as QuestionnairesDialogKey));
      setActiveSurveyQuestions([]);
      return;
    }

    const controller = new AbortController();
    surveyDialogAbortControllerRef.current = controller;

    setIsSurveyDialogLoading(true);
    setSurveyDialogError(null);

    fetchSurveyWithQuestions(surveyId, token, controller.signal)
      .then(async (data) => {
        if (controller.signal.aborted) {
          return;
        }

        const sortedQuestions = sortSurveyQuestions(data.questions);
        const questionById = new Map(sortedQuestions.map((question) => [question.id, question]));
        let answers: ReadonlyArray<SurveyQuestionAnswer> = Array.isArray(data.answers) ? data.answers : [];

        if (userSurveyRoundId != null) {
          try {
            const fetchedAnswers = await fetchSurveyAnswers(token, userSurveyRoundId, surveyId, {
              signal: controller.signal,
            });

            if (!controller.signal.aborted && fetchedAnswers.length) {
              const mergedAnswers = new Map<number, SurveyQuestionAnswer>();

              for (const answer of answers) {
                mergedAnswers.set(answer.questionId, answer);
              }

              for (const answer of fetchedAnswers) {
                mergedAnswers.set(answer.questionId, answer);
              }

              answers = Array.from(mergedAnswers.values());
            }
          } catch (error) {
            if (!(error instanceof DOMException && error.name === 'AbortError')) {
              console.error('Failed to fetch survey answers', error);
            }
          }

          if (controller.signal.aborted) {
            return;
          }
        }

        const resolveAnswerText = (answer: SurveyQuestionAnswer): string => {
          const responseText = typeof answer.responseText === 'string' ? answer.responseText.trim() : '';

          if (responseText) {
            return responseText;
          }

          const regularText = typeof answer.text === 'string' ? answer.text.trim() : '';

          return regularText;
        };

        const parseAnswerDate = (rawText: string): Date | null => {
          if (!rawText) {
            return null;
          }

          const isoDate = new Date(rawText);

          if (!Number.isNaN(isoDate.getTime())) {
            return isoDate;
          }

          const trimmed = rawText.trim();
          const parts = trimmed.split(/\D+/).filter(Boolean);

          if (parts.length < 3) {
            return null;
          }

          const [first, second, third] = parts;
          const yearPart = third.length === 4 ? third : (parts.find((value) => value.length === 4) ?? third);

          if (!yearPart || yearPart.length !== 4) {
            return null;
          }

          const dayPart = yearPart === third ? first : parts[parts.indexOf(yearPart) - 2];
          const monthPart = yearPart === third ? second : parts[parts.indexOf(yearPart) - 1];

          if (!dayPart || !monthPart) {
            return null;
          }

          const day = Number.parseInt(dayPart, 10);
          const month = Number.parseInt(monthPart, 10);
          const year = Number.parseInt(yearPart, 10);

          if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
            return null;
          }

          if (day < 1 || day > 31 || month < 1 || month > 12) {
            return null;
          }

          const parsed = new Date(year, month - 1, day);

          if (
            parsed.getFullYear() !== year
            || parsed.getMonth() !== month - 1
            || parsed.getDate() !== day
          ) {
            return null;
          }

          return parsed;
        };

        const answeredQuestionIds = new Set<number>();

        for (const answer of answers) {
          if (answer.answerOptionId != null) {
            answeredQuestionIds.add(answer.questionId);
            continue;
          }

          const normalizedText = resolveAnswerText(answer);

          if (normalizedText.length > 0) {
            answeredQuestionIds.add(answer.questionId);
          }
        }

        const nextQuestionAnswers = answers.reduce<Record<number, Date | number | string | null>>((accumulator, answer) => {
          const question = questionById.get(answer.questionId);

          if (!question) {
            return accumulator;
          }

          const normalizedType = normalizeQuestionType(question.type);

          if (normalizedType === 'date') {
            const rawText = resolveAnswerText(answer);

            if (!rawText) {
              return accumulator;
            }

            const parsedDate = parseAnswerDate(rawText);

            if (parsedDate) {
              accumulator[answer.questionId] = parsedDate;
            }
          } else if (normalizedType === 'singlechoice') {
            const optionId = typeof answer.answerOptionId === 'number' && Number.isFinite(answer.answerOptionId)
              ? answer.answerOptionId
              : null;

            if (optionId != null) {
              accumulator[answer.questionId] = optionId;
            }
          } else if (normalizedType === 'hourandminute') {
            const rawNumericText = resolveAnswerText(answer);
            const parsedNumber = Number.parseInt(rawNumericText ?? '', 10);

            if (!Number.isNaN(parsedNumber)) {
              accumulator[answer.questionId] = Math.min(168, Math.max(0, parsedNumber));
            }
          } else if (normalizedType === 'days') {
            const rawNumericText = resolveAnswerText(answer);
            const parsedNumber = Number.parseInt(rawNumericText ?? '', 10);

            if (!Number.isNaN(parsedNumber)) {
              accumulator[answer.questionId] = Math.min(7, Math.max(0, parsedNumber));
            }
          } else if (normalizedType === 'text') {
            const normalized = resolveAnswerText(answer);

            if (normalized.length > 0) {
              accumulator[answer.questionId] = normalized;
            }
          }

          return accumulator;
        }, {});

        const firstUnansweredIndex = sortedQuestions.findIndex((question) => !answeredQuestionIds.has(question.id));
        const preferredIndex = firstUnansweredIndex === -1
          ? Math.max(sortedQuestions.length - 1, 0)
          : firstUnansweredIndex;
        const resolvedInitialIndex = clampQuestionIndex(preferredIndex, sortedQuestions.length);

        setActiveSurveyData(data);
        setActiveSurveyQuestions(sortedQuestions);
        setActiveSurveyTitle(resolveSurveyDialogTitle(data.code, data.translations, currentLanguage, normalizeTranslation));
        setQuestionAnswers(nextQuestionAnswers);
        setPersistedAnswerLookup(() => {
          const lookup: Record<number, true> = {};
          answeredQuestionIds.forEach((id) => {
            lookup[id] = true;
          });
          return lookup;
        });
        setCurrentQuestionIndex(resolvedInitialIndex === -1 ? 0 : resolvedInitialIndex);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        const message = error instanceof ApiError
          ? error.originalMessage
          : error instanceof Error
            ? error.message
            : null;

        setActiveSurveyQuestions([]);
        setSurveyDialogError(message ?? t('dialog.error' as QuestionnairesDialogKey));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsSurveyDialogLoading(false);
          surveyDialogAbortControllerRef.current = null;
        }
      });
  }, [accessToken, clearSurveyDialogRequest, clearSubmitAnswerRequest, currentLanguage, normalizeTranslation, t, userSurveyRoundId]);

  const closeSurveyDialog = useCallback(() => {
    clearSurveyDialogRequest();
    clearSubmitAnswerRequest();
    setIsSurveyDialogOpen(false);
    setIsSurveyDialogLoading(false);
    setSurveyDialogError(null);
    setActiveSurveyId(null);
    setActiveSurveyData(null);
    setActiveSurveyTitle('');
    setCurrentQuestionIndex(0);
    setActiveSurveyQuestions([]);
    setQuestionAnswers({});
    setPersistedAnswerLookup({});
    setIsSubmittingAnswer(false);
    setSubmitAnswerError(null);
  }, [clearSurveyDialogRequest, clearSubmitAnswerRequest]);

  const handleRetryLoadSurvey = useCallback(() => {
    if (activeSurveyId) {
      loadSurveyQuestions(activeSurveyId);
    }
  }, [activeSurveyId, loadSurveyQuestions]);

  const handleContinueSurvey = useCallback((surveyId: string) => {
    const survey = surveys.find((item) => String(item.id) === surveyId);

    setActiveSurveyId(surveyId);
    setIsSurveyDialogOpen(true);
    setSurveyDialogError(null);
    setActiveSurveyQuestions([]);
    setActiveSurveyData(null);
    setCurrentQuestionIndex(0);
    setQuestionAnswers({});
    setPersistedAnswerLookup({});
    setSubmitAnswerError(null);
    setIsSubmittingAnswer(false);
    clearSubmitAnswerRequest();

    if (survey) {
      setActiveSurveyTitle(resolveSurveyTitle(survey, currentLanguage, normalizeTranslation));
    }

    loadSurveyQuestions(surveyId);
  }, [clearSubmitAnswerRequest, currentLanguage, loadSurveyQuestions, normalizeTranslation, surveys]);

  useEffect(() => () => {
    clearSurveyDialogRequest();
    clearSubmitAnswerRequest();
  }, [clearSurveyDialogRequest, clearSubmitAnswerRequest]);

  useEffect(() => {
    const abortController = new AbortController();
    let isActive = true;

    if (import.meta.env.DEV && !hasSkippedStrictModeEffectRef.current) {
      hasSkippedStrictModeEffectRef.current = true;
      return () => {
        isActive = false;
        abortController.abort();
      };
    }

    const token = accessToken?.trim() ?? '';

    if (!token) {
      setIsFetching(false);
      setSurveys([]);
      setFetchError(null);
      setUserSurveyRoundId(null);
      setRoundName(null);
      lastFetchedTokenRef.current = null;
      return () => {
        isActive = false;
        abortController.abort();
      };
    }

    if (lastFetchedTokenRef.current === token) {
      return () => {
        isActive = false;
        abortController.abort();
      };
    }

    setIsFetching(true);
    setFetchError(null);

    fetchCardSurveys(token, abortController.signal)
      .then((response) => {
        if (!isActive) {
          return;
        }

        const rounds = response.rounds ?? [];
        const targetRound = rounds.find((round) => round?.name?.trim().toLowerCase() === 't0');
        const fallbackRound = rounds.find((round) => Array.isArray(round?.userSurvey) && round.userSurvey.length > 0);
        const effectiveRound = targetRound ?? fallbackRound ?? null;
        const nextSurveys = effectiveRound?.userSurvey?.filter((survey): survey is CardSurvey => Boolean(survey)) ?? [];

        setSurveys(nextSurveys);
        setUserSurveyRoundId(effectiveRound?.idUserSurveyRound ?? null);
        setRoundName(effectiveRound?.name ?? null);
        if (effectiveRound?.name) {
          const normalizedName = effectiveRound.name.trim().toLowerCase();
          setTabValue(normalizedName || 't0');
        } else {
          setTabValue('t0');
        }
        lastFetchedTokenRef.current = token;
      })
      .catch((error: unknown) => {
        if (!isActive || (error instanceof DOMException && error.name === 'AbortError')) {
          return;
        }

        const message = error instanceof ApiError
          ? error.originalMessage
          : error instanceof Error
            ? error.message
            : null;

        setFetchError(message ?? DEFAULT_FETCH_ERROR_MESSAGE);
        setSurveys([]);
        setUserSurveyRoundId(null);
        setRoundName(null);
        setTabValue('t0');
        lastFetchedTokenRef.current = null;
      })
      .finally(() => {
        if (isActive) {
          setIsFetching(false);
        }
      });

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [accessToken]);

  const responsesLabel = t('actions.responses' as QuestionnaireActionKey);
  const continueLabel = t('actions.continue' as QuestionnaireActionKey);
  const startLabel = t('actions.start' as QuestionnaireActionKey, { defaultValue: continueLabel }) as string;
  const emptyTitle = t('empty.title' as QuestionnairesEmptyKey);
  const emptyDescription = t('empty.description' as QuestionnairesEmptyKey);
  const effectiveEmptyDescription = fetchError ?? emptyDescription;

  const filterLabels = useMemo(() => new Map<StatusFilterValue, string>(
    STATUS_ORDER.map((value) => [value, t(getFilterTranslationKey(value))]),
  ), [t]);

  const questionnaireCards = useMemo<ReadonlyArray<CardModel>>(
    () => surveys.map((survey) => {
      const title = resolveSurveyTitle(survey, currentLanguage, normalizeTranslation);
      const surveyId = String(survey.id);
      const status = localSurveyStatus[surveyId] ?? resolveCardStatus(survey.status);
      const customContinueLabel: string | undefined = status === 'not_started' ? startLabel : continueLabel;
      const progress = localSurveyProgress[surveyId] ?? clampProgress(survey.completionPercentage);

      return {
        id: surveyId,
        title,
        status,
        statusLabel: t(getStatusTranslationKey(status)),
        progress,
        customContinueLabel,
      } satisfies CardModel;
    }),
    [surveys, currentLanguage, normalizeTranslation, t, continueLabel, startLabel, localSurveyProgress, localSurveyStatus],
  );

  const filteredQuestionnaires = useMemo<ReadonlyArray<CardModel>>(
    () => (statusFilter === 'all'
      ? questionnaireCards
      : questionnaireCards.filter((questionnaire) => questionnaire.status === statusFilter)
    ),
    [questionnaireCards, statusFilter],
  );

  const dropdownItems = useMemo<DropdownItem[]>(() =>
    STATUS_ORDER.map((value) => {
      const label = filterLabels.get(value) ?? '';

      return {
        id: value,
        label,
        content: (
          <StatusBadge
            status={value}
            label={label}
            variant="inline"
            showDot={value !== 'all'}
          />
        ),
        className: value === statusFilter ? 'is-active' : undefined,
        onSelect: () => setStatusFilter(value),
      };
    }),
  [filterLabels, statusFilter, setStatusFilter],
  );

  const currentFilterLabel = filterLabels.get(statusFilter) ?? '';

  const tabItems = useMemo<ReadonlyArray<TabItem>>(() => {
    const isLoading = isFetching && !roundName;
    const formattedRoundName = roundName ? normalizeTranslation(roundName) : '';
    const displayLabel = isLoading ? (
      <Skeleton className="questionnaires-tab-skeleton" />
    ) : formattedRoundName;
    const value = (roundName?.trim().toLowerCase()) || 't0';

    return [{
      value,
      label: displayLabel,
      content: (
        <section
          className="questionnaires-page-content"
          aria-live="polite"
          aria-busy={isFetching}
        >
          <QuestionnaireGrid
            questionnaires={filteredQuestionnaires}
            responsesLabel={responsesLabel}
            continueLabel={continueLabel}
            emptyTitle={emptyTitle}
            emptyDescription={effectiveEmptyDescription}
            onContinue={handleContinueSurvey}
            isLoading={isFetching}
          />
        </section>
      ),
    }];
  }, [continueLabel, effectiveEmptyDescription, emptyTitle, filteredQuestionnaires, handleContinueSurvey, isFetching, normalizeTranslation, responsesLabel, roundName]);

  const dialogContinueLabel = t('actions.continue' as QuestionnaireActionKey);
  const dialogBackLabel = t('actions.back' as QuestionnaireActionKey);
  const dialogCloseLabel = t('actions.close' as QuestionnaireActionKey);
  const dialogRetryLabel = t('actions.retry' as QuestionnaireActionKey);
  const dialogErrorMessage = surveyDialogError ?? t('dialog.error' as QuestionnairesDialogKey);

  const totalQuestions = activeSurveyQuestions.length;
  const hasQuestions = totalQuestions > 0;
  const resolvedCurrentIndex = clampQuestionIndex(currentQuestionIndex, totalQuestions);
  const currentQuestion = hasQuestions ? activeSurveyQuestions[resolvedCurrentIndex] ?? null : null;
  const currentQuestionAnswer = currentQuestion ? questionAnswers[currentQuestion.id] ?? null : null;
  const dialogSubtitle = currentQuestion ? resolveQuestionTitle(currentQuestion, currentLanguage) : undefined;
  const handleGoBack = useCallback(() => {
    clearSubmitAnswerRequest();
    setIsSubmittingAnswer(false);
    setSubmitAnswerError(null);

    if (!hasQuestions) {
      return;
    }

    setCurrentQuestionIndex((previous) => {
      const nextIndex = previous - 1;
      return nextIndex <= 0 ? 0 : nextIndex;
    });
  }, [clearSubmitAnswerRequest, hasQuestions]);

  const handleGoNext = useCallback(async () => {
    if (isSubmittingAnswer) {
      return;
    }

    const trimmedToken = accessToken?.trim() ?? '';
    const clampedIndex = clampQuestionIndex(currentQuestionIndex, totalQuestions);
    const question = activeSurveyQuestions[clampedIndex];

    if (!question) {
      return;
    }

    const normalizedType = normalizeQuestionType(question.type);
    const answerValue = questionAnswers[question.id] ?? null;

    if (normalizedType === 'date' && !(answerValue instanceof Date)) {
      return;
    }

    if (normalizedType === 'singlechoice' && typeof answerValue !== 'number') {
      return;
    }

    if (normalizedType === 'hourandminute') {
      if (typeof answerValue !== 'number') {
        return;
      }

      if (Number.isNaN(answerValue) || answerValue < 0 || answerValue > 168) {
        return;
      }
    }

    if (normalizedType === 'days') {
      if (typeof answerValue !== 'number') {
        return;
      }

      if (Number.isNaN(answerValue) || answerValue < 0 || answerValue > 7) {
        return;
      }
    }

    if (normalizedType === 'text' && typeof answerValue !== 'string') {
      return;
    }

    if (!trimmedToken) {
      setSubmitAnswerError(t('dialog.error' as QuestionnairesDialogKey));
      return;
    }

    if (userSurveyRoundId == null) {
      setSubmitAnswerError(t('dialog.error' as QuestionnairesDialogKey));
      return;
    }

    const answerOptionId = normalizedType === 'singlechoice' && typeof answerValue === 'number'
      ? answerValue
      : null;
    const responseText = answerValue instanceof Date
      ? answerValue.toISOString().split('T')[0]
      : typeof answerValue === 'string'
        ? answerValue
        : (normalizedType === 'hourandminute' || normalizedType === 'days') && typeof answerValue === 'number'
          ? String(answerValue)
          : null;

    const hasPersistedAnswer = Boolean(persistedAnswerLookup[question.id]);

    setIsSubmittingAnswer(true);
    setSubmitAnswerError(null);
    clearSubmitAnswerRequest();

    const controller = new AbortController();
    submitAnswerAbortControllerRef.current = controller;

    try {
      const payload = {
        questionId: question.id,
        answerOptionId,
        userSurveyRoundId,
        responseText,
      } as const;

      if (hasPersistedAnswer) {
        await updateQuestionAnswer(trimmedToken, payload, controller.signal);
      } else {
        await submitQuestionAnswer(trimmedToken, payload, controller.signal);
      }

      setCurrentQuestionIndex((index) => {
        const effectiveIndex = clampQuestionIndex(index, totalQuestions);
        const nextIndex = effectiveIndex + 1;

        if (nextIndex >= totalQuestions || nextIndex === -1) {
          if (activeSurveyId) {
            setLocalSurveyProgress((previous) => (
              previous[activeSurveyId] === 100
                ? previous
                : {
                    ...previous,
                    [activeSurveyId]: 100,
                  }
            ));
            setLocalSurveyStatus((previous) => (
              previous[activeSurveyId] === 'completed'
                ? previous
                : {
                    ...previous,
                    [activeSurveyId]: 'completed',
                  }
            ));
          }

          closeSurveyDialog();
          return effectiveIndex;
        }

        return nextIndex;
      });

      setPersistedAnswerLookup((previous) => (
        previous[question.id]
          ? previous
          : {
            ...previous,
            [question.id]: true,
          }
      ));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      const message = error instanceof ApiError
        ? error.originalMessage
        : error instanceof Error
          ? error.message
          : null;

      setSubmitAnswerError(message ?? t('dialog.error' as QuestionnairesDialogKey));
    } finally {
      if (!controller.signal.aborted) {
        setIsSubmittingAnswer(false);
        submitAnswerAbortControllerRef.current = null;
      }
    }
  }, [
    accessToken,
    activeSurveyQuestions,
    activeSurveyId,
    clearSubmitAnswerRequest,
    closeSurveyDialog,
    currentQuestionIndex,
    isSubmittingAnswer,
    questionAnswers,
    setLocalSurveyProgress,
    setLocalSurveyStatus,
    t,
    userSurveyRoundId,
    persistedAnswerLookup,
  ]);

  const handleQuestionAnswerChange = useCallback((questionId: number, value: Date | number | string | null) => {
    setSubmitAnswerError(null);

    const question = activeSurveyQuestions.find((item) => item.id === questionId) ?? null;
    const normalizedType = question ? normalizeQuestionType(question.type) : null;

    setQuestionAnswers((previous) => {
      const previousValue = previous[questionId] ?? null;

      if (previousValue instanceof Date && value instanceof Date) {
        if (previousValue.getTime() === value.getTime()) {
          return previous;
        }
      } else if (previousValue === value) {
        return previous;
      }

      if (value == null) {
        if (!(questionId in previous)) {
          return previous;
        }

        const next = { ...previous };
        delete next[questionId];
        return next;
      }

      if (value instanceof Date) {
        if (normalizedType && normalizedType !== 'date') {
          return previous;
        }

        return {
          ...previous,
          [questionId]: value,
        };
      }

      if (typeof value === 'number') {
        if (normalizedType && !(
          normalizedType === 'singlechoice'
          || normalizedType === 'hourandminute'
          || normalizedType === 'days'
        )) {
          return previous;
        }

        return {
          ...previous,
          [questionId]: value,
        };
      }

      if (typeof value === 'string') {
        const trimmed = value.trim();

        if (trimmed.length === 0) {
          if (!(questionId in previous)) {
            return previous;
          }

          const next = { ...previous };
          delete next[questionId];
          return next;
        }

        if (normalizedType && normalizedType !== 'text') {
          return previous;
        }

        return {
          ...previous,
          [questionId]: trimmed,
        };
      }

      return previous;
    });
  }, [activeSurveyQuestions]);

  useEffect(() => {
    if (!activeSurveyId) {
      return;
    }

    const totalQuestions = activeSurveyQuestions.length;

    if (totalQuestions === 0) {
      return;
    }

    const answeredQuestions = new Set<number>();

    for (const question of activeSurveyQuestions) {
      const value = questionAnswers[question.id] ?? null;

      if (value instanceof Date) {
        answeredQuestions.add(question.id);
        continue;
      }

      if (typeof value === 'number') {
        answeredQuestions.add(question.id);
        continue;
      }

      if (value != null) {
        answeredQuestions.add(question.id);
        continue;
      }

      if (persistedAnswerLookup[question.id]) {
        answeredQuestions.add(question.id);
      }
    }

    const nextProgress = totalQuestions > 0
      ? Math.round((answeredQuestions.size / totalQuestions) * 100)
      : 0;
    const nextStatus: CardStatus = nextProgress >= 100
      ? 'completed'
      : answeredQuestions.size > 0
        ? 'in_progress'
        : 'not_started';

    setLocalSurveyProgress((previous) => {
      const current = previous[activeSurveyId];

      if (current === nextProgress) {
        return previous;
      }

      return {
        ...previous,
        [activeSurveyId]: nextProgress,
      };
    });

    setLocalSurveyStatus((previous) => {
      const current = previous[activeSurveyId];

      if (current === nextStatus) {
        return previous;
      }

      return {
        ...previous,
        [activeSurveyId]: nextStatus,
      };
    });
  }, [activeSurveyId, activeSurveyQuestions, questionAnswers, persistedAnswerLookup, totalQuestions]);

  const dialogActions = useMemo(() => {
    const progressLabel = totalQuestions > 0 ? `${clampQuestionIndex(currentQuestionIndex, totalQuestions) + 1}/${totalQuestions}` : '';

    if (!isSurveyDialogOpen) {
      return null;
    }

    if (isSurveyDialogLoading) {
      return (
        <div className="survey-dialog-actions" aria-hidden="true">
          <Skeleton className="survey-dialog-actions-skeleton" />
        </div>
      );
    }

    if (surveyDialogError) {
      return (
        <div className="survey-dialog-actions">
          <Button variant="border" onClick={closeSurveyDialog}>
            {dialogCloseLabel}
          </Button>
          <Button variant="solid" onClick={handleRetryLoadSurvey}>
            {dialogRetryLabel}
          </Button>
        </div>
      );
    }

    if (!hasQuestions) {
      return (
        <Button variant="solid" onClick={closeSurveyDialog}>
          {dialogCloseLabel}
        </Button>
      );
    }

    const isLastStep = clampQuestionIndex(currentQuestionIndex, totalQuestions) >= totalQuestions - 1 && totalQuestions > 0;

    return (
      <div className="survey-dialog-actions">
        <div className="survey-dialog-actions-button survey-dialog-actions-button-left">
          <Button
            variant="border"
            onClick={handleGoBack}
            disabled={resolvedCurrentIndex === 0 || isSubmittingAnswer}
          >
            <ArrowLeftIcon width={16} height={16} />
            {dialogBackLabel}
          </Button>
        </div>

        <div className="survey-dialog-actions-progress" aria-live="polite">
          {progressLabel}
        </div>

        <div className="survey-dialog-actions-button survey-dialog-actions-button-right">
          <Button
            variant="solid"
            onClick={handleGoNext}
            disabled={isSubmittingAnswer}
            loading={isSubmittingAnswer}
          >
            {isLastStep ? dialogCloseLabel : dialogContinueLabel}
          </Button>
        </div>
      </div>
    );
  }, [
    closeSurveyDialog,
    currentQuestionIndex,
    dialogBackLabel,
    dialogCloseLabel,
    dialogContinueLabel,
    dialogRetryLabel,
    handleGoBack,
    handleRetryLoadSurvey,
    handleGoNext,
    hasQuestions,
    isSubmittingAnswer,
    isSurveyDialogLoading,
    isSurveyDialogOpen,
    surveyDialogError,
    totalQuestions,
  ]);

  const dialogTitle = t('dialog.title' as QuestionnairesDialogKey, {
    title: activeSurveyTitle || activeSurveyData?.code || '',
  });

  const dialogBody = (() => {
    if (isSurveyDialogLoading) {
      return (
        <div className="survey-questions-loading" aria-busy="true">
          <SurveyQuestionSkeleton />
        </div>
      );
    }

    if (surveyDialogError) {
      return (
        <div className="survey-questions__status">
          <Warning message={dialogErrorMessage} />
        </div>
      );
    }

    if (!currentQuestion) {
      return (
        <div className="survey-questions-loading" aria-busy="true">
          <SurveyQuestionSkeleton />
        </div>
      );
    }

    return (
      <ul className="survey-questions-list">
        <li className="survey-questions-list__item">
          <SurveyQuestionStep
            question={currentQuestion}
            language={currentLanguage}
            languageFallbacks={questionLanguageFallbacks}
            answerValue={currentQuestionAnswer ?? null}
            onAnswerChange={(value) => handleQuestionAnswerChange(currentQuestion.id, value)}
          />
          {submitAnswerError ? (
            <div className="survey-questions__status">
              <Warning message={submitAnswerError} />
            </div>
          ) : null}
        </li>
      </ul>
    );
  })();

  return (
    <>
      <PageHeader
        title={t('header.title' as QuestionnairesHeaderKey)}
        subtitle={t('header.subtitle' as QuestionnairesHeaderKey)}
      />

      <div className="questionnaires-page-filters">
        <Dropdown
          variant="filter"
          trigger={(
            <button
              type="button"
              className="dropdown-trigger--filter"
              aria-haspopup="listbox"
              aria-expanded={isFilterOpen}
            >
              <StatusBadge
                status={statusFilter}
                label={currentFilterLabel}
                variant="inline"
                showDot={statusFilter !== 'all'}
              />
            </button>
          )}
          items={dropdownItems}
          align="end"
          onOpenChange={setIsFilterOpen}
        />
      </div>

      <Tab
        items={tabItems}
        value={tabValue}
        onValueChange={setTabValue}
      />

      <div className="survey-questions-dialog">
        <Dialog
          isOpen={isSurveyDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeSurveyDialog();
            }
          }}
          title={dialogTitle}
          subtitle={dialogSubtitle}
          actions={dialogActions}
        >
          {dialogBody}
        </Dialog>
      </div>
    </>
  );
}
