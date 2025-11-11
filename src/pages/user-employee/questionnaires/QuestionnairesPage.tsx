import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/layout/page-layout/page-header/PageHeader';
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
import {
  fetchCardSurveys,
  fetchSurveyWithQuestions,
  submitQuestionAnswer,
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
import { resolveQuestionTitle } from './questions/questionUtils';

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

  return language.trim().toLowerCase();
};

const resolveSurveyTitle = (survey: CardSurvey, language: string): string => {
  const translations = survey.translations ?? [];

  if (!translations.length) {
    return survey.code;
  }

  const normalizedLanguage = normalizeLanguage(language);
  const languageWithoutRegion = normalizedLanguage?.split('-')[0] ?? null;

  const candidates = translations.filter((translation) => isNonEmptyTranslationTitle(translation.title));

  if (!candidates.length) {
    return formatTitle(survey.code);
  }

  if (normalizedLanguage) {
    const exactMatch = candidates.find((translation) => normalizeLanguage(translation.language) === normalizedLanguage);

    if (exactMatch) {
      return formatTitle(exactMatch.title!);
    }
  }

  if (languageWithoutRegion) {
    const partialMatch = candidates.find((translation) => normalizeLanguage(translation.language)?.startsWith(languageWithoutRegion));

    if (partialMatch) {
      return formatTitle(partialMatch.title!);
    }
  }

  return formatTitle(candidates[0].title!);
};

const isNonEmptyTranslationTitle = (title: string | null | undefined): title is string =>
  typeof title === 'string' && title.trim().length > 0;

const DEFAULT_FETCH_ERROR_MESSAGE = 'Unable to load questionnaires.';

const formatTitle = (rawTitle: string): string => {
  const trimmed = rawTitle.trim();

  if (!trimmed) {
    return rawTitle;
  }

  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const resolveSurveyDialogTitle = (
  code: string,
  translationsInput: ReadonlyArray<CardSurveyTranslation> | null | undefined,
  language: string,
): string => {
  if (!code) {
    return '';
  }

  const translations = translationsInput ?? [];

  if (!translations.length) {
    return formatTitle(code);
  }

  const normalizedLanguage = normalizeLanguage(language);
  const languageWithoutRegion = normalizedLanguage?.split('-')[0] ?? null;
  const candidates = translations.filter((translation) => isNonEmptyTranslationTitle(translation.title));

  if (!candidates.length) {
    return formatTitle(code);
  }

  if (normalizedLanguage) {
    const exactMatch = candidates.find((translation) => normalizeLanguage(translation.language) === normalizedLanguage);

    if (exactMatch?.title) {
      return formatTitle(exactMatch.title);
    }
  }

  if (languageWithoutRegion) {
    const partialMatch = candidates.find((translation) => normalizeLanguage(translation.language)?.startsWith(languageWithoutRegion));

    if (partialMatch?.title) {
      return formatTitle(partialMatch.title);
    }
  }

  const fallbackTitle = candidates[0]?.title;
  return fallbackTitle ? formatTitle(fallbackTitle) : formatTitle(code);
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

export default function QuestionnairesPage() {
  const { t, i18n } = useTranslation<'questionnaires'>('questionnaires');
  const accessToken = useAuthStore((state) => state.accessToken);
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeSurveyTitle, setActiveSurveyTitle] = useState('');
  const [activeSurveyQuestions, setActiveSurveyQuestions] = useState<ReadonlyArray<SurveyQuestion>>([]);
  const [questionAnswers, setQuestionAnswers] = useState<Record<number, Date | null>>({});
  const submitAnswerAbortControllerRef = useRef<AbortController | null>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [submitAnswerError, setSubmitAnswerError] = useState<string | null>(null);
  const [userSurveyRoundId, setUserSurveyRoundId] = useState<number | null>(null);
  const surveyDialogAbortControllerRef = useRef<AbortController | null>(null);

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
      .then((data) => {
        if (controller.signal.aborted) {
          return;
        }

        const sortedQuestions = sortSurveyQuestions(data.questions);
        const questionLookup = new Map(sortedQuestions.map((question) => [question.id, question]));
        const answers = Array.isArray(data.answers) ? data.answers : [];

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

        const nextQuestionAnswers = answers.reduce<Record<number, Date | null>>((accumulator, answer) => {
          const question = questionLookup.get(answer.questionId);

          if (!question) {
            return accumulator;
          }

          const normalizedType = question.type?.trim().toLowerCase() ?? '';

          if (normalizedType === 'date') {
            const rawText = resolveAnswerText(answer);

            if (!rawText) {
              return accumulator;
            }

            const parsedDate = parseAnswerDate(rawText);

            if (parsedDate) {
              accumulator[answer.questionId] = parsedDate;
            }
          }

          return accumulator;
        }, {});

        const firstUnansweredIndex = sortedQuestions.findIndex((question) => !answeredQuestionIds.has(question.id));
        const nextQuestionIndex = firstUnansweredIndex === -1
          ? Math.max(sortedQuestions.length - 1, 0)
          : firstUnansweredIndex;

        setActiveSurveyData(data);
        setActiveSurveyQuestions(sortedQuestions);
        setActiveSurveyTitle(resolveSurveyDialogTitle(data.code, data.translations, i18n.language));
        setQuestionAnswers(nextQuestionAnswers);
        setCurrentQuestionIndex(nextQuestionIndex);
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
  }, [accessToken, clearSurveyDialogRequest, clearSubmitAnswerRequest, i18n.language, t]);

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
    setSubmitAnswerError(null);
    setIsSubmittingAnswer(false);
    clearSubmitAnswerRequest();

    if (survey) {
      setActiveSurveyTitle(resolveSurveyTitle(survey, i18n.language));
    }

    loadSurveyQuestions(surveyId);
  }, [clearSubmitAnswerRequest, i18n.language, loadSurveyQuestions, surveys]);

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
        const nextSurveys = targetRound?.userSurvey?.filter((survey): survey is CardSurvey => Boolean(survey)) ?? [];

        setSurveys(nextSurveys);
        setUserSurveyRoundId(targetRound?.idUserSurveyRound ?? null);
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
      const status = resolveCardStatus(survey.status);
      const title = resolveSurveyTitle(survey, i18n.language);
      const customContinueLabel: string | undefined = status === 'not_started' ? startLabel : continueLabel;

      return {
        id: String(survey.id),
        title,
        status,
        statusLabel: t(getStatusTranslationKey(status)),
        progress: clampProgress(survey.completionPercentage),
        customContinueLabel,
      } satisfies CardModel;
    }),
    [surveys, t, i18n.language, continueLabel, startLabel],
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

  const tabItems = useMemo<ReadonlyArray<TabItem>>(() => ([
    { value: 't0', label: 'T0' },
  ]
    .map((tab) => ({
      ...tab,
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
    }))
  ), [continueLabel, effectiveEmptyDescription, emptyTitle, filteredQuestionnaires, handleContinueSurvey, isFetching, responsesLabel]);

  const dialogContinueLabel = t('actions.continue' as QuestionnaireActionKey);
  const dialogBackLabel = t('actions.back' as QuestionnaireActionKey);
  const dialogCloseLabel = t('actions.close' as QuestionnaireActionKey);
  const dialogRetryLabel = t('actions.retry' as QuestionnaireActionKey);
  const dialogErrorMessage = surveyDialogError ?? t('dialog.error' as QuestionnairesDialogKey);

  const hasQuestions = activeSurveyQuestions.length > 0;
  const currentQuestion = hasQuestions ? activeSurveyQuestions[currentQuestionIndex] : null;
  const currentQuestionAnswer = currentQuestion ? questionAnswers[currentQuestion.id] ?? null : null;
  const dialogSubtitle = currentQuestion ? resolveQuestionTitle(currentQuestion, i18n.language) : undefined;
  const totalQuestions = activeSurveyQuestions.length;
  const handleGoBack = useCallback(() => {
    clearSubmitAnswerRequest();
    setIsSubmittingAnswer(false);
    setSubmitAnswerError(null);
    setCurrentQuestionIndex((index) => Math.max(index - 1, 0));
  }, [clearSubmitAnswerRequest]);

  const handleGoNext = useCallback(async () => {
    if (isSubmittingAnswer) {
      return;
    }

    const trimmedToken = accessToken?.trim() ?? '';
    const question = activeSurveyQuestions[currentQuestionIndex];

    if (!question) {
      return;
    }

    const normalizedType = question?.type?.trim().toLowerCase() ?? '';
    const answerValue = questionAnswers[question.id] ?? null;

    if (normalizedType === 'date' && !(answerValue instanceof Date)) {
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

    const responseText = answerValue instanceof Date
      ? answerValue.toISOString().split('T')[0]
      : null;

    setIsSubmittingAnswer(true);
    setSubmitAnswerError(null);
    clearSubmitAnswerRequest();

    const controller = new AbortController();
    submitAnswerAbortControllerRef.current = controller;

    try {
      await submitQuestionAnswer(trimmedToken, {
        questionId: question.id,
        answerOptionId: null,
        userSurveyRoundId,
        responseText,
      }, controller.signal);

      setCurrentQuestionIndex((index) => {
        if (index >= activeSurveyQuestions.length - 1) {
          closeSurveyDialog();
          return index;
        }

        return index + 1;
      });
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
    clearSubmitAnswerRequest,
    closeSurveyDialog,
    currentQuestionIndex,
    isSubmittingAnswer,
    questionAnswers,
    t,
    userSurveyRoundId,
  ]);

  const handleQuestionAnswerChange = useCallback((questionId: number, value: Date | null) => {
    setSubmitAnswerError(null);

    setQuestionAnswers((previous) => {
      const previousValue = previous[questionId] ?? null;

      if (previousValue instanceof Date && value instanceof Date) {
        if (previousValue.getTime() === value.getTime()) {
          return previous;
        }
      } else if (previousValue === value) {
        return previous;
      }

      if (value === null) {
        const next = { ...previous };
        delete next[questionId];
        return next;
      }

      return {
        ...previous,
        [questionId]: value,
      };
    });
  }, []);

  const dialogActions = useMemo(() => {
    const currentIndex = currentQuestionIndex + 1;
    const progressLabel = totalQuestions > 0 ? `${currentIndex}/${totalQuestions}` : '';

    if (!isSurveyDialogOpen) {
      return null;
    }

    if (isSurveyDialogLoading) {
      return (
        <Button variant="solid" disabled>
          {dialogContinueLabel}
        </Button>
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

    const isLastStep = currentQuestionIndex >= totalQuestions - 1;

    if (previousValue instanceof Date && value instanceof Date) {
      if (previousValue.getTime() === value.getTime()) {
        return previous;
      }
    } else if (previousValue === value) {
      return previous;
    }

    if (value === null) {
      const next = { ...previous };
      delete next[questionId];
      return next;
    }
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
    hasQuestions,
    isSurveyDialogLoading,
    isSurveyDialogOpen,
    currentQuestion,
    currentQuestionAnswer,
    handleGoNext,
    isSubmittingAnswer,
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
            language={i18n.language}
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

      <Tab items={tabItems} defaultValue="t0" />

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
