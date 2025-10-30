import type { CardStatus } from '../card/Card';
import './status-badge.scss';

export type StatusBadgeValue = CardStatus | 'all';

export interface StatusBadgeProps {
  readonly status: StatusBadgeValue;
  readonly label?: string;
  readonly variant?: 'banner' | 'inline';
  readonly showDot?: boolean;
  readonly className?: string;
}

export default function StatusBadge({
  status,
  label,
  variant = 'banner',
  showDot = true,
  className,
}: StatusBadgeProps) {
  if (!showDot && !label) {
    return null;
  }

  const isInline = variant === 'inline';
  const classes = `status-badge${isInline ? ' status-badge--inline' : ''}${className ? ` ${className}` : ''}`;

  const Component = isInline ? 'span' : 'div';

  return (
    <Component className={classes} data-status={status}>
      {showDot && (
        <span className="status-badge-dot" aria-hidden="true" />
      )}
      {label && <span className="status-badge-label">{label}</span>}
    </Component>
  );
}
