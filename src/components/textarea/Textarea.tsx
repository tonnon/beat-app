import { forwardRef } from 'react';
import type {
  ComponentPropsWithoutRef,
  ForwardedRef,
  ReactNode,
} from 'react';
import { TextArea } from '@radix-ui/themes';

import './textarea.scss';

type RadixTextAreaProps = ComponentPropsWithoutRef<typeof TextArea>;

export interface TextareaProps extends RadixTextAreaProps {
  readonly id: string;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly wrapperClassName?: string;
  readonly error?: boolean;
  readonly labelSuffix?: ReactNode;
  readonly labelIcon?: ReactNode;
}

function TextareaComponent(
  {
    id,
    label,
    description,
    wrapperClassName,
    error = false,
    labelSuffix,
    labelIcon,
    className,
    required,
    ...textAreaProps
  }: TextareaProps,
  ref: ForwardedRef<HTMLTextAreaElement>,
) {
  const fieldClassNames = ['app-textarea'];
  if (wrapperClassName) {
    fieldClassNames.push(wrapperClassName);
  }

  const textAreaClassNames = ['app-textarea-input'];
  if (error) {
    textAreaClassNames.push('app-textarea-input--error');
  }
  if (className) {
    textAreaClassNames.push(className);
  }

  const descriptionId = description ? `${id}-description` : undefined;
  const isRequired = Boolean(required);

  return (
    <div className={fieldClassNames.join(' ')}>
      {label ? (
        <div className="app-textarea-label-wrapper">
          <label className="app-textarea-label" htmlFor={id}>
            <span className="app-textarea-label-content">
              <span className="app-textarea-label-text">
                {label}
                {isRequired ? (
                  <span aria-hidden="true" className="app-textarea-required-indicator">
                    *
                  </span>
                ) : null}
              </span>
              {labelIcon ? (
                <span className="app-textarea-label-icon">{labelIcon}</span>
              ) : null}
            </span>
          </label>
          {labelSuffix ? <span className="app-textarea-label-suffix">{labelSuffix}</span> : null}
        </div>
      ) : null}
      <TextArea
        id={id}
        ref={ref}
        className={textAreaClassNames.join(' ')}
        aria-describedby={descriptionId}
        aria-invalid={error || undefined}
        required={required}
        {...textAreaProps}
      />
      {description ? (
        <p id={descriptionId} className="app-textarea-description">
          {description}
        </p>
      ) : null}
    </div>
  );
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(TextareaComponent);

Textarea.displayName = 'Textarea';

export default Textarea;
