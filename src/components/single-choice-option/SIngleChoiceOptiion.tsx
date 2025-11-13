import { forwardRef } from 'react';
import Checkbox, { type CheckboxProps } from '../checkbox/Checkbox';
import './single-choice-option.scss';

export type SingleChoiceOptionProps = Omit<CheckboxProps, 'variant' | 'wrapperClassName' | 'labelClassName'> & {
  readonly containerClassName?: string;
  readonly wrapperClassName?: string;
  readonly labelClassName?: string;
};

const SingleChoiceOption = forwardRef<HTMLButtonElement, SingleChoiceOptionProps>(
  ({ containerClassName, wrapperClassName, labelClassName, ...checkboxProps }, ref) => {
    const containerClasses = ['single-choice-option', containerClassName].filter(Boolean).join(' ');
    const mergedWrapperClasses = ['single-choice-option-wrapper', wrapperClassName].filter(Boolean).join(' ');
    const mergedLabelClasses = ['single-choice-option-label', labelClassName].filter(Boolean).join(' ');

    return (
      <div className={containerClasses}>
        <Checkbox
          ref={ref}
          variant="rounded-checkbox"
          wrapperClassName={mergedWrapperClasses}
          labelClassName={mergedLabelClasses}
          {...checkboxProps}
        />
      </div>
    );
  },
);

SingleChoiceOption.displayName = 'SingleChoiceOption';

export default SingleChoiceOption;
