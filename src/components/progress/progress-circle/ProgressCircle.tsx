import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import './progress-circle.scss';

export interface ProgressCircleProps {
  readonly value: number;
  readonly label?: string;
  readonly size?: number;
  readonly color?: string;
}

const DEFAULT_SIZE = 112;
const STROKE_WIDTH = 10;

export default function ProgressCircle({
  value,
  label,
  size = DEFAULT_SIZE,
  color,
}: ProgressCircleProps) {
  const { normalizedValue, center, radius, circumference, strokeDashoffset } = useMemo(() => {
    const clampedValue = Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 0;
    const computedCenter = size / 2;
    const computedRadius = computedCenter - STROKE_WIDTH / 2;
    const circleCircumference = 2 * Math.PI * computedRadius;
    const dashoffset = circleCircumference * (1 - clampedValue / 100);

    return {
      normalizedValue: clampedValue,
      center: computedCenter,
      radius: computedRadius,
      circumference: circleCircumference,
      strokeDashoffset: dashoffset,
    };
  }, [value, size]);

  const percentageLabel = `${Math.round(normalizedValue)}%`;
  const autoColor = normalizedValue >= 100
    ? '#4df0f6'
    : normalizedValue > 0
      ? '#ffa703'
      : undefined;

  const resolvedColor = color ?? autoColor;

  const style = (resolvedColor
    ? ({ '--progress-circle-color': resolvedColor } as CSSProperties)
    : undefined);

  return (
    <div
      className="progress-circle"
      role="img"
      aria-label={label ? `${label}: ${percentageLabel}` : percentageLabel}
      style={style}
    >
      <div className="progress-circle-inner">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle
            data-circle="track"
            cx={center}
            cy={center}
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={0}
          />
          <circle
            data-circle="progress"
            cx={center}
            cy={center}
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </svg>
        <span className="progress-circle-value" aria-hidden="true">
          {percentageLabel}
        </span>
      </div>
    </div>
  );
}
