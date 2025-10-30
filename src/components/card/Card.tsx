import type { CSSProperties } from 'react';
import ProgressCircle from '../progress/progress-circle/ProgressCircle';
import StatusBadge from '../status-badge/StatusBadge';
import Button from '../button/Button';
import './card.scss';

export type CardStatus = 'completed' | 'in_progress' | 'not_started';

export interface CardModel {
  readonly id: string;
  readonly title: string;
  readonly status: CardStatus;
  readonly statusLabel: string;
  readonly progress: number;
}

export type CardActionHandler = (id: string) => void;

export interface CardProps extends CardModel {
  readonly responsesLabel: string;
  readonly continueLabel: string;
  readonly onViewResponses?: CardActionHandler;
  readonly onContinue?: CardActionHandler;
  readonly headerColor?: string;
  readonly progressColor?: string;
}

export default function Card({
  id,
  title,
  status,
  statusLabel,
  progress,
  responsesLabel,
  continueLabel,
  onViewResponses,
  onContinue,
  headerColor,
  progressColor,
}: CardProps) {
  const isComplete = progress >= 100;
  const accentColor = headerColor ?? '#079fa4';
  const style = {
    '--questionnaire-status-bar-bg': accentColor,
  } as CSSProperties & Record<string, string>;

  return (
    <article className="questionnaire-card" data-status={status} style={style}>
      <header className="questionnaire-card-header">
        <StatusBadge status={status} label={statusLabel} />
      </header>

      <div className="questionnaire-card-body">
        <h3 className="questionnaire-card-title">{title}</h3>
        <ProgressCircle value={progress} label={title} color={progressColor} />
      </div>

      <footer className="questionnaire-card-footer">
        <Button
          variant="border"
          onClick={() => onViewResponses?.(id)}
        >
          {responsesLabel}
        </Button>

        <Button
          variant="solid"
          onClick={() => onContinue?.(id)}
          disabled={isComplete}
        >
          {continueLabel}
        </Button>
      </footer>
    </article>
  );
}
