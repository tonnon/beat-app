import Card from '../../components/card/Card';
import type { CardActionHandler, CardModel } from '../../components/card/Card';
import './card-grid.scss';

export interface QuestionnaireGridProps {
  readonly questionnaires: ReadonlyArray<CardModel>;
  readonly responsesLabel: string;
  readonly continueLabel: string;
  readonly emptyTitle: string;
  readonly emptyDescription?: string;
  readonly onViewResponses?: CardActionHandler;
  readonly onContinue?: CardActionHandler;
}

export default function QuestionnaireGrid({
  questionnaires,
  responsesLabel,
  continueLabel,
  emptyTitle,
  emptyDescription,
  onViewResponses,
  onContinue,
}: QuestionnaireGridProps) {
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
            onViewResponses={onViewResponses}
            onContinue={onContinue}
          />
        </div>
      ))}
    </div>
  );
}
