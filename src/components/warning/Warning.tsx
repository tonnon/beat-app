import type { ReactNode } from 'react';
import { AlertCircleIcon, ExclamationIcon } from '@/components/icons/Icons';
import './warning.scss';

type WarningVariant = 'error' | 'success' | 'important';

export interface WarningProps {
  readonly variant?: WarningVariant;
  readonly message: ReactNode;
  readonly title?: ReactNode;
  readonly className?: string;
}

export default function Warning({ variant = 'error', message, title, className }: WarningProps) {
  const classes = `warning warning-${variant}${className ? ` ${className}` : ''}`;

  if (variant === 'important') {
    return (
      <div className={classes} role="alert">
        <ExclamationIcon className="warning-icon" size={32} />
        <div className="warning-important-content">
          {title ? <p className="warning-important-title">{title}</p> : null}
          <p className="warning-important-message">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={classes} role="alert">
      <AlertCircleIcon className="warning-icon" size={20} />
      <p className="warning-message">{message}</p>
    </div>
  );
}
