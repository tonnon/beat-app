import { useMemo } from 'react';
import Skeleton from '@/components/skeleton/Skeleton';
import Textfield from '@/components/textfield/Textfield';
import SingleChoiceOption from '@/components/single-choice-option/SIngleChoiceOptiion';
import Textarea from '@/components/textarea/Textarea';
import type { SurveyAnswerOption, SurveyAnswerOptionTranslation, SurveyQuestion } from '@/services/cardSurveys/cardSurveysService';
import { normalizeTranslationText } from '@/hooks/useNormalizedTranslation';
import { normalizeQuestionType, resolveQuestionTranslation } from './questionUtils';
import './questions.scss';

const normalizeOptionLanguage = (language: string | null | undefined): string | null => {
  if (!language) {
    return null;
  }

  return language.trim().replace(/_/g, '-').toLowerCase();
};

const toReadonlyArray = <T,>(value: ReadonlyArray<T> | null | undefined): ReadonlyArray<T> => (
  Array.isArray(value) ? value : []
);

const pickSingleChoiceOptionTranslation = (
  option: SurveyAnswerOption,
  language: string,
): SurveyAnswerOptionTranslation | null => {
  const translations = toReadonlyArray(option.translations);

  if (!translations.length) {
    return null;
  }

  const normalizedLanguage = normalizeOptionLanguage(language);
  const languageWithoutRegion = normalizedLanguage?.split('-')[0] ?? null;

  if (normalizedLanguage) {
    const exactMatch = translations.find((translation) => normalizeOptionLanguage(translation.language) === normalizedLanguage);

    if (exactMatch) {
      return exactMatch;
    }

    if (languageWithoutRegion) {
      const partialMatch = translations.find((translation) => normalizeOptionLanguage(translation.language)?.startsWith(languageWithoutRegion));

      if (partialMatch) {
        return partialMatch;
      }
    }
  }

  if (languageWithoutRegion) {
    const containedMatch = translations.find((translation) => {
      const normalized = normalizeOptionLanguage(translation.language);

      if (!normalized) {
        return false;
      }

      return normalized.split('-').includes(languageWithoutRegion);
    });

    if (containedMatch) {
      return containedMatch;
    }
  }

  return translations[0] ?? null;
};

const resolveSingleChoiceOptionLabel = (option: SurveyAnswerOption, languages: ReadonlyArray<string>): string => {
  const translation = languages.reduce<SurveyAnswerOptionTranslation | null>((result, candidate) => (
    result ?? pickSingleChoiceOptionTranslation(option, candidate)
  ), null) ?? pickSingleChoiceOptionTranslation(option, languages[0] ?? '') ?? null;

  return normalizeTranslationText(translation?.text ?? null);
};

const resolveSingleChoiceOptions = (question: SurveyQuestion): ReadonlyArray<SurveyAnswerOption> => {
  const rawOptions = toReadonlyArray(question.answerOptions ?? question.anwserOptions);

  if (!rawOptions.length) {
    return rawOptions;
  }

  return [...rawOptions].sort((a, b) => {
    const orderA = typeof a.orderIndex === 'number' ? a.orderIndex : Number.POSITIVE_INFINITY;
    const orderB = typeof b.orderIndex === 'number' ? b.orderIndex : Number.POSITIVE_INFINITY;

    if (orderA === orderB) {
      return a.id - b.id;
    }

    return orderA - orderB;
  });
};

export interface SurveyQuestionStepProps {
  readonly question: SurveyQuestion;
  readonly language: string;
  readonly languageFallbacks?: ReadonlyArray<string>;
  readonly answerValue?: Date | number | string | null;
  readonly onAnswerChange?: (value: Date | number | string | null) => void;
}

export default function SurveyQuestionStep({
  question,
  language,
  languageFallbacks,
  answerValue,
  onAnswerChange,
}: SurveyQuestionStepProps) {
  const normalizedType = normalizeQuestionType(question.type);
  const isDateQuestion = normalizedType === 'date';
  const isSingleChoiceQuestion = normalizedType === 'singlechoice';
  const isHourAndMinuteQuestion = normalizedType === 'hourandminute';
  const isDaysQuestion = normalizedType === 'days';
  const handleDateChange = onAnswerChange
    ? (value: Date | null) => onAnswerChange(value)
    : undefined;
  const dateAnswerValue = answerValue instanceof Date ? answerValue : null;
  const singleChoiceAnswer = typeof answerValue === 'number' ? answerValue : null;
  const textAnswerValue = typeof answerValue === 'string' ? answerValue : '';
  const hourAndMinuteAnswer = isHourAndMinuteQuestion && typeof answerValue === 'number'
    ? answerValue
    : null;
  const hourAndMinuteValue = hourAndMinuteAnswer != null
    ? String(hourAndMinuteAnswer)
    : '';
  const daysAnswer = isDaysQuestion && typeof answerValue === 'number'
    ? answerValue
    : null;
  const daysValue = daysAnswer != null
    ? String(daysAnswer)
    : '';
  const singleChoiceOptions = isSingleChoiceQuestion
    ? resolveSingleChoiceOptions(question)
    : [];
  const languageCandidates = useMemo(() => {
    const inputs = [
      ...(languageFallbacks ?? []),
      language,
      language.includes('-') ? language.split('-')[0] : null,
      ...toReadonlyArray(question.questionTranslations).map((item) => item.language ?? null),
      ...toReadonlyArray(question.translations).map((item) => item.language ?? null),
    ];
    const seen = new Set<string>();
    const candidates: string[] = [];

    for (const value of inputs) {
      if (!value) {
        continue;
      }

      const normalized = normalizeOptionLanguage(value);

      if (!normalized || seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      candidates.push(value);
    }

    return candidates.length ? candidates : [language];
  }, [language, languageFallbacks, question]);

  const questionTranslation = useMemo(() => {
    for (const candidate of languageCandidates) {
      const resolved = resolveQuestionTranslation(question, candidate);

      if (resolved) {
        return resolved;
      }
    }

    return resolveQuestionTranslation(question, language);
  }, [language, languageCandidates, question]);

  const pretitle = normalizeTranslationText(questionTranslation?.pretitle);
  const helpText = questionTranslation?.helpText?.trim() ?? '';
  const questionTitle = normalizeTranslationText(questionTranslation?.title);
  const shouldRenderHelpParagraph = Boolean(helpText) && !isDateQuestion && !isHourAndMinuteQuestion;

  const handleSingleChoiceChange = (optionId: number, checked: boolean) => {
    if (!onAnswerChange) {
      return;
    }

    onAnswerChange(checked ? optionId : null);
  };

  return (
    <article className="survey-question-step">
      {(pretitle || shouldRenderHelpParagraph) ? (
        <div className="survey-question-step-content">
          {pretitle ? <p className="survey-question-step-pretitle">{pretitle}</p> : null}
          {shouldRenderHelpParagraph ? <p className="survey-question-step-help">{helpText}</p> : null}
        </div>
      ) : null}
      {normalizedType === 'text' ? (
        <div className="survey-question-step-field">
          <Textarea
            id={`survey-question-${question.id}-textarea`}
            label={questionTitle || pretitle || undefined}
            description={helpText || undefined}
            value={textAnswerValue}
            onChange={(event) => onAnswerChange?.(event.currentTarget.value)}
          />
        </div>
      ) : null}
      {isHourAndMinuteQuestion ? (
        <div className="survey-question-step-field">
          <Textfield
            id={`survey-question-${question.id}-hour-and-minute`}
            label={questionTitle || pretitle || undefined}
            description={helpText || undefined}
            type="number"
            inputMode="numeric"
            min={0}
            max={168}
            step={1}
            value={hourAndMinuteValue}
            onChange={(event) => {
              if (!onAnswerChange) {
                return;
              }

              const rawValue = event.currentTarget.value;

              if (!rawValue) {
                onAnswerChange(null);
                return;
              }

              const parsed = Number.parseInt(rawValue, 10);

              if (Number.isNaN(parsed)) {
                return;
              }

              const clamped = Math.min(168, Math.max(0, parsed));
              onAnswerChange(clamped);
            }}
          />
        </div>
      ) : null}
      {isDaysQuestion ? (
        <div className="survey-question-step-field">
          <Textfield
            id={`survey-question-${question.id}-days`}
            label={questionTitle || pretitle || undefined}
            description={helpText || undefined}
            type="number"
            inputMode="numeric"
            min={0}
            max={7}
            step={1}
            value={daysValue}
            onChange={(event) => {
              if (!onAnswerChange) {
                return;
              }

              const rawValue = event.currentTarget.value;

              if (!rawValue) {
                onAnswerChange(null);
                return;
              }

              const parsed = Number.parseInt(rawValue, 10);

              if (Number.isNaN(parsed)) {
                return;
              }

              const clamped = Math.min(7, Math.max(0, parsed));
              onAnswerChange(clamped);
            }}
          />
        </div>
      ) : null}
      {isDateQuestion ? (
        <div className="survey-question-step-field">
          <Textfield
            id={`survey-question-${question.id}-date`}
            variant="date-picker"
            label=""
            description={helpText || undefined}
            value={dateAnswerValue}
            onDateChange={handleDateChange}
            placeholder={questionTitle || pretitle || undefined}
          />
        </div>
      ) : null}
      {isSingleChoiceQuestion && singleChoiceOptions.length ? (
        <div className="survey-question-step-options-wrapper">
          <ul className="survey-question-step-options">
            {singleChoiceOptions.map((option) => {
              const label = resolveSingleChoiceOptionLabel(option, languageCandidates);

              if (!label) {
                return null;
              }

              return (
                <li key={option.id} className="survey-question-step-options__item">
                  <SingleChoiceOption
                    label={label}
                    checked={singleChoiceAnswer === option.id}
                    onCheckedChange={(checked) => handleSingleChoiceChange(option.id, checked === true)}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

export function SurveyQuestionSkeleton() {
  const optionPlaceholders = Array.from({ length: 3 });

  return (
    <article className="survey-question-step">
      <div className="survey-question-step-skeleton-wrapper" aria-hidden="true">
        <Skeleton className="survey-question-step-skeleton-pretitle" />
        <Skeleton className="survey-question-step-skeleton-title" />
        <div className="survey-question-step-skeleton-options">
          {optionPlaceholders.map((_, index) => (
            <Skeleton key={`option-${index}`} className="survey-question-step-skeleton-option" />
          ))}
        </div>
      </div>
    </article>
  );
}
