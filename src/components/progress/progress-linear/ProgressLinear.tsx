import { forwardRef } from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type * as React from 'react';

import './progress-linear.scss';

export type ProgressLinearProps = ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
  readonly label?: ReactNode;
  readonly variant?: 'soft' | 'solid';
};

type ProgressLinearElement = React.ElementRef<typeof ProgressPrimitive.Root>;

const ProgressLinear = forwardRef<ProgressLinearElement, ProgressLinearProps>(
  ({ className, value, max = 100, label, variant = 'soft', ...props }, ref) => {
    const clampedValue = typeof value === 'number' ? Math.min(Math.max(value, 0), max) : undefined;
    const rootClasses = ['progress-linear-root', `progress-linear-root--${variant}`];
    const indicatorClasses = ['progress-linear-indicator', `progress-linear-indicator--${variant}`];

    if (className) {
      rootClasses.push(className);
    }

    const progressTransform = typeof clampedValue === 'number'
      ? `translateX(-${100 - (clampedValue / max) * 100}%)`
      : undefined;

    return (
      <div className="progress-linear">
        {label ? <span className="progress-linear-label">{label}</span> : null}
        <ProgressPrimitive.Root
          ref={ref}
          className={rootClasses.join(' ')}
          max={max}
          value={clampedValue}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={indicatorClasses.join(' ')}
            style={{ transform: progressTransform }}
          />
        </ProgressPrimitive.Root>
      </div>
    );
  }
);

ProgressLinear.displayName = 'ProgressLinear';

export default ProgressLinear;
