import Skeleton from '@/components/skeleton/Skeleton';
import Textfield from '@/components/textfield/Textfield';
import type { SurveyQuestion } from '@/services/cardSurveys/cardSurveysService';
import { normalizeTranslationText } from '@/hooks/useNormalizedTranslation';
import { normalizeQuestionType, resolveQuestionTitle, resolveQuestionTranslation } from './questionUtils';
import './questions.scss';

export interface SurveyQuestionStepProps {
  readonly question: SurveyQuestion;
  readonly language: string;
  readonly answerValue?: Date | null;
  readonly onAnswerChange?: (value: Date | null) => void;
}

export default function SurveyQuestionStep({
  question,
  language,
  answerValue,
  onAnswerChange,
}: SurveyQuestionStepProps) {
  const translation = resolveQuestionTranslation(question, language);
  const pretitle = normalizeTranslationText(translation?.pretitle);
  const helpText = translation?.helpText?.trim() ?? '';
  const questionTitle = resolveQuestionTitle(question, language);
  const isDateQuestion = normalizeQuestionType(question.type) === 'date';
  const shouldRenderHelpParagraph = Boolean(helpText) && !isDateQuestion;
  const handleDateChange = onAnswerChange;

  return (
    <article className="survey-question-step">
      {(pretitle || shouldRenderHelpParagraph) ? (
        <div className="survey-question-step-content">
          {pretitle ? <p className="survey-question-step-pretitle">{pretitle}</p> : null}
          {shouldRenderHelpParagraph ? <p className="survey-question-step-help">{helpText}</p> : null}
        </div>
      ) : null}
      {isDateQuestion ? (
        <div className="survey-question-step-field">
          <Textfield
            id={`survey-question-${question.id}-date`}
            variant="date-picker"
            label=""
            description={helpText || undefined}
            value={answerValue ?? null}
            onDateChange={handleDateChange}
            placeholder={questionTitle || pretitle || undefined}
          />
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
