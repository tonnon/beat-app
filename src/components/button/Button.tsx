import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Primitive } from '@radix-ui/react-primitive';
import Spinner from '@/components/spinner/Spinner';
import type { SpinnerProps } from '@/components/spinner/Spinner';
import './button.scss';

type ButtonVariant = 'solid' | 'border';
type ButtonSize = 'md' | 'lg';

type ButtonBaseProps = {
  readonly variant?: ButtonVariant;
  readonly children?: ReactNode;
  readonly text?: ReactNode;
  readonly size?: ButtonSize;
  readonly loading?: boolean;
  readonly spinnerSize?: SpinnerProps['size'];
  readonly icon?: ReactNode;
  readonly iconPosition?: 'left' | 'right';
};

type NativeButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

type ButtonProps = ButtonBaseProps & Omit<NativeButtonProps, 'children'>;

const PrimitiveButton = Primitive.button;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant: appearance = 'solid',
  children,
  text,
  className,
  size = 'md',
  loading = false,
  spinnerSize,
  icon,
  iconPosition = 'left',
  type = 'button',
  ...nativeProps
}, ref) {
  const isDisabled = nativeProps.disabled ?? false;
  const derivedSpinnerSize = spinnerSize ?? (size === 'lg' ? 'md' : 'sm');
  const classes = [
    'app-button',
    `app-button-${appearance}`,
    `app-button-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const textContent = text ?? children;
  const showIcon = !loading && icon;

  const content = (
    <>
      {loading ? (
        <Spinner
          size={derivedSpinnerSize}
          className="app-button-spinner"
          role="presentation"
          aria-hidden="true"
        />
      ) : null}
      {showIcon && iconPosition === 'left' ? (
        <span className="app-button-icon app-button-icon-left">{icon}</span>
      ) : null}
      {textContent}
      {showIcon && iconPosition === 'right' ? (
        <span className="app-button-icon app-button-icon-right">{icon}</span>
      ) : null}
    </>
  );

  return (
    <PrimitiveButton
      ref={ref}
      type={type}
      className={classes}
      disabled={loading || isDisabled}
      data-loading={loading ? 'true' : undefined}
      {...nativeProps}
    >
      {content}
    </PrimitiveButton>
  );
});

export default Button;
