import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { Primitive } from '@radix-ui/react-primitive';
import './spinner.scss';

type SpinnerSize = 'sm' | 'md';

type PrimitiveDivProps = ComponentPropsWithoutRef<typeof Primitive.div>;

export interface SpinnerProps extends PrimitiveDivProps {
  readonly size?: SpinnerSize;
}

const SIZE_CLASSNAME_MAP: Record<SpinnerSize, string> = {
  sm: 'spinner--sm',
  md: 'spinner--md',
};

const SpinnerIndicator = Primitive.span;

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(function Spinner({
  size = 'md',
  className,
  role,
  'aria-label': ariaLabel = 'Loading',
  'aria-live': ariaLive,
  ...restProps
}, ref) {
  const sizeClassName = SIZE_CLASSNAME_MAP[size];
  const classes = className
    ? `spinner ${sizeClassName} ${className}`
    : `spinner ${sizeClassName}`;

  const derivedRole = role ?? 'status';
  const derivedAriaLive = derivedRole === 'status' ? (ariaLive ?? 'polite') : ariaLive;

  return (
    <Primitive.div
      ref={ref}
      className={classes}
      role={derivedRole}
      aria-live={derivedAriaLive}
      aria-label={ariaLabel}
      {...restProps}
    >
      <SpinnerIndicator className="spinner-indicator" aria-hidden="true" />
    </Primitive.div>
  );
});

export default Spinner;
