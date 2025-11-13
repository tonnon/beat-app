import { forwardRef } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon } from '@radix-ui/react-icons';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import './checkbox.scss';

type RadixCheckboxProps = ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>;

export interface CheckboxProps extends RadixCheckboxProps {
  readonly className?: string;
  readonly wrapperClassName?: string;
  readonly label?: ReactNode;
  readonly labelClassName?: string;
  readonly variant?: 'rounded-checkbox';
}

const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>((
  { className, wrapperClassName, label, labelClassName, variant, ...props },
  ref
) => {
  const wrapperClasses = wrapperClassName ? `checkbox-wrapper ${wrapperClassName}` : 'checkbox-wrapper';
  const checkboxClasses = ['checkbox', variant, className].filter(Boolean).join(' ');
  const labelClasses = ['checkbox-label', labelClassName].filter(Boolean).join(' ');

  return (
    <label className={wrapperClasses}>
      <CheckboxPrimitive.Root ref={ref} className={checkboxClasses} {...props}>
        <CheckboxPrimitive.Indicator className="checkbox-indicator">
          <CheckIcon />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label ? <span className={labelClasses}>{label}</span> : null}
    </label>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
