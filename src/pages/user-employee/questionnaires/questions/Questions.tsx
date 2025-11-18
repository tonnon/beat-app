import { useEffect, useMemo } from 'react';
import Skeleton from '@/components/skeleton/Skeleton';
import Textfield from '@/components/textfield/Textfield';
import SingleChoiceOption from '@/components/single-choice-option/SIngleChoiceOptiion';
import Slider from '@/components/slider/Slider';
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

interface SingleChoiceOptionEntry {
  readonly option: SurveyAnswerOption;
  readonly label: string;
}

interface RatingScaleData {
  readonly marks: ReadonlyArray<number>;
  readonly optionIdByValue: ReadonlyMap<number, number>;
  readonly valueByOptionId: ReadonlyMap<number, number>;
}

const resolveRatingScaleData = (entries: ReadonlyArray<SingleChoiceOptionEntry>): RatingScaleData | null => {
  if (!entries.length) {
    return null;
  }

  const marks: number[] = [];

  const optionIdByValue = new Map<number, number>();
  const valueByOptionId = new Map<number, number>();

  entries.forEach(({ option }, index) => {
    const value = index + 1;

    marks.push(value);
    optionIdByValue.set(value, option.id);
    valueByOptionId.set(option.id, value);
  });

  return {
    marks,
    optionIdByValue,
    valueByOptionId,
  };
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
  const isRatingScaleQuestion = normalizedType === 'ratingscale';
  const isHourAndMinuteQuestion = normalizedType === 'hourandminute';
  const isDaysQuestion = normalizedType === 'days';
  const isNumericQuestion = normalizedType === 'numeric';
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
  const numericAnswer = isNumericQuestion && typeof answerValue === 'number'
    ? answerValue
    : null;
  const numericValue = numericAnswer != null
    ? String(numericAnswer)
    : '';
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

  const shouldResolveChoiceOptions = isSingleChoiceQuestion || isRatingScaleQuestion;

  const choiceOptionEntries = useMemo<ReadonlyArray<SingleChoiceOptionEntry>>(() => {
    if (!shouldResolveChoiceOptions) {
      return [];
    }

    const options = resolveSingleChoiceOptions(question);

    return options.map((option) => ({
      option,
      label: resolveSingleChoiceOptionLabel(option, languageCandidates),
    }));
  }, [languageCandidates, question, shouldResolveChoiceOptions]);

  const singleChoiceOptionEntries = useMemo(() => (
    isSingleChoiceQuestion ? choiceOptionEntries : []
  ), [choiceOptionEntries, isSingleChoiceQuestion]);

  const ratingScaleOptionEntries = useMemo(() => (
    isRatingScaleQuestion ? choiceOptionEntries : []
  ), [choiceOptionEntries, isRatingScaleQuestion]);

  const ratingScaleData = useMemo(() => (
    isRatingScaleQuestion ? resolveRatingScaleData(ratingScaleOptionEntries) : null
  ), [isRatingScaleQuestion, ratingScaleOptionEntries]);

  const ratingScaleValue = ratingScaleData && singleChoiceAnswer != null
    ? ratingScaleData.valueByOptionId.get(singleChoiceAnswer) ?? null
    : null;

  useEffect(() => {
    if (
      !isRatingScaleQuestion ||
      !ratingScaleData ||
      ratingScaleValue != null ||
      !onAnswerChange
    ) {
      return;
    }

    const defaultMark = ratingScaleData.marks[0] ?? null;

    if (defaultMark == null) {
      return;
    }

    const defaultOptionId = ratingScaleData.optionIdByValue.get(defaultMark) ?? null;

    if (defaultOptionId != null) {
      onAnswerChange(defaultOptionId);
    }
  }, [
    isRatingScaleQuestion,
    ratingScaleData,
    ratingScaleValue,
    onAnswerChange,
  ]);

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
      {isNumericQuestion ? (
        <div className="survey-question-step-field">
          <Textfield
            id={`survey-question-${question.id}-numeric`}
            label={questionTitle || pretitle || undefined}
            description={helpText || undefined}
            type="number"
            inputMode="decimal"
            step="any"
            value={numericValue}
            onChange={(event) => {
              if (!onAnswerChange) {
                return;
              }

              const rawValue = event.currentTarget.value;

              if (!rawValue) {
                onAnswerChange(null);
                return;
              }

              const parsed = Number.parseFloat(rawValue);

              if (Number.isNaN(parsed)) {
                return;
              }

              onAnswerChange(parsed);
            }}
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
      {isRatingScaleQuestion && ratingScaleData ? (
        <div className="survey-question-step-field">
          <Slider
            id={`survey-question-${question.id}-slider`}
            min={ratingScaleData.marks[0]}
            max={ratingScaleData.marks[ratingScaleData.marks.length - 1]}
            step={1}
            marks={ratingScaleData.marks}
            value={ratingScaleValue}
            label={questionTitle || pretitle || undefined}
            showLabel={false}
            onChange={(nextValue) => {
              if (!onAnswerChange) {
                return;
              }

              const optionId = ratingScaleData.optionIdByValue.get(nextValue) ?? null;

              if (optionId != null) {
                onAnswerChange(optionId);
              }
            }}
          />
        </div>
      ) : null}
      {isSingleChoiceQuestion && singleChoiceOptionEntries.length ? (
        <div className="survey-question-step-options-wrapper">
          <ul className="survey-question-step-options">
            {singleChoiceOptionEntries.map(({ option, label }) => {
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
