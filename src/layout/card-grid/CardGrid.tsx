import Card from '../../components/card/Card';
import type { CardActionHandler, CardModel } from '../../components/card/Card';
import Skeleton from '@/components/skeleton/Skeleton';
import './card-grid.scss';

const SKELETON_CARD_COUNT = 4;

export interface QuestionnaireGridProps {
  readonly questionnaires: ReadonlyArray<CardModel>;
  readonly responsesLabel: string;
  readonly continueLabel: string;
  readonly emptyTitle: string;
  readonly emptyDescription?: string;
  readonly onViewResponses?: CardActionHandler;
  readonly onContinue?: CardActionHandler;
  readonly isLoading?: boolean;
}

export default function QuestionnaireGrid({
  questionnaires,
  responsesLabel,
  continueLabel,
  emptyTitle,
  emptyDescription,
  onViewResponses,
  onContinue,
  isLoading = false,
}: QuestionnaireGridProps) {
  if (isLoading) {
    return (
      <div className="questionnaire-grid" role="list" aria-live="polite">
        {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
          <div key={`skeleton-${index}`} className="questionnaire-grid__skeleton" role="listitem">
            <Skeleton className="questionnaire-grid__skeleton-card">
              Loading
            </Skeleton>
          </div>
        ))}
      </div>
    );
  }

  if (!questionnaires.length) {
    return (
      <div className="questionnaire-grid-empty" role="status" aria-live="polite">
        <h3 className="questionnaire-grid-empty-title">{emptyTitle}</h3>
        {emptyDescription && (
          <p className="questionnaire-grid-empty-description">{emptyDescription}</p>
        )}
      </div>
    );
  }

  return (
    <div className="questionnaire-grid" role="list">
      {questionnaires.map((questionnaire) => (
        <div key={questionnaire.id} role="listitem">
          <Card
            {...questionnaire}
            responsesLabel={responsesLabel}
            continueLabel={continueLabel}
            customContinueLabel={questionnaire.customContinueLabel}
            onViewResponses={onViewResponses}
            onContinue={onContinue}
          />
        </div>
      ))}
    </div>
  );
}
