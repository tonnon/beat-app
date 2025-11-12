import { useMemo, useState } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/button/Button';
import Link from '@/components/link/Link';
import Textfield from '@/components/textfield/Textfield';
import Warning from '@/components/warning/Warning';
import type esAuth from '@/locales/es/auth.json';
import { ApiError, resendConfirmationEmail } from '@/services/auth/authService';
import './confirm-email.scss';

export type ConfirmEmailErrorTranslationKey = 'confirmEmail.errors.invalidEmailOrCode' | 'errors.generic';

type ConfirmEmailProps = {
  readonly email?: string;
  readonly token?: string;
  readonly onResendRequest?: () => void;
  readonly onEmailChange?: (email: string) => void;
  readonly onTokenChange?: (token: string) => void;
  readonly onConfirm?: () => void;
  readonly emailReadOnly?: boolean;
  readonly tokenReadOnly?: boolean;
  readonly errorTranslationKey?: ConfirmEmailErrorTranslationKey | null;
  readonly errorMessage?: string | null;
  readonly successMessage?: string | null;
  readonly isResendPending?: boolean;
  readonly isSubmitting?: boolean;
};

export default function ConfirmEmail({
  email,
  token,
  onResendRequest,
  onEmailChange,
  onTokenChange,
  onConfirm,
  emailReadOnly = false,
  tokenReadOnly = true,
  errorTranslationKey,
  errorMessage,
  successMessage,
  isResendPending = false,
  isSubmitting = false,
}: ConfirmEmailProps) {
  const { t } = useTranslation<'auth'>('auth');
  const [localResendPending, setLocalResendPending] = useState(false);
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null);
  const [localSuccessMessage, setLocalSuccessMessage] = useState<string | null>(null);
  const confirmEmail = useMemo(() => t('confirmEmail', { returnObjects: true }) as (typeof esAuth)['confirmEmail'], [t]);
  const translatedError = useMemo(() => {
    if (errorTranslationKey) {
      return t(errorTranslationKey);
    }

    return errorMessage ?? localErrorMessage;
  }, [errorMessage, errorTranslationKey, localErrorMessage, t]);
  const effectiveSuccessMessage = successMessage ?? localSuccessMessage;
  const effectiveIsResendPending = isResendPending || localResendPending;

  const handleResendClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (effectiveIsResendPending) {
      return;
    }

    if (onResendRequest) {
      onResendRequest();
      return;
    }

    const trimmedEmail = email?.trim() ?? '';
    const resendMessages = confirmEmail.resend;

    if (!trimmedEmail) {
      setLocalErrorMessage(resendMessages?.missingEmail ?? t('errors.generic'));
      setLocalSuccessMessage(null);
      return;
    }

    setLocalResendPending(true);
    setLocalSuccessMessage(null);
    setLocalErrorMessage(null);

    try {
      await resendConfirmationEmail({ email: trimmedEmail });
      setLocalSuccessMessage(resendMessages?.success ?? t('errors.generic'));
    } catch (error) {
      if (error instanceof ApiError) {
        setLocalErrorMessage(error.originalMessage);
        return;
      }

      if (error instanceof Error) {
        setLocalErrorMessage(error.message);
        return;
      }

      setLocalErrorMessage(t('errors.generic'));
    } finally {
      setLocalResendPending(false);
    }
  };

  const handleEmailInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onEmailChange?.(event.target.value);
  };

  const handleTokenInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onTokenChange?.(event.target.value);
  };

  const shouldDisplayRecoveryFields = Boolean(translatedError);
  const emailValue = email ?? '';
  const tokenValue = token ?? '';
  const shouldRenderEmailField = shouldDisplayRecoveryFields;
  const shouldRenderTokenField = shouldDisplayRecoveryFields;
  const tokenFieldIsReadOnly = shouldDisplayRecoveryFields ? false : tokenReadOnly;
  const shouldRenderConfirmButton = shouldDisplayRecoveryFields && Boolean(onConfirm);

  const handleConfirmClick = () => {
    if (!onConfirm || isSubmitting) {
      return;
    }

    onConfirm();
  };

  return (
    <div className="confirm-email">
      <p className="confirm-email-message">
        {confirmEmail.bodyPrefix}
        <Link
          to="#"
          label={confirmEmail.linkLabel}
          variant="important"
          onClick={handleResendClick}
        />
        {confirmEmail.bodySuffix}
      </p>
      {shouldRenderEmailField ? (
        <Textfield
          id="confirm-email-email"
          label={confirmEmail.emailField.label}
          type="email"
          value={emailValue}
          onChange={handleEmailInputChange}
          required
          disabled={isSubmitting}
          readOnly={emailReadOnly}
          aria-readonly={emailReadOnly}
          description={emailReadOnly ? confirmEmail.readonlyHint?.email : undefined}
          autoComplete="email"
          wrapperClassName="confirm-email-email-field"
        />
      ) : null}
      {shouldRenderTokenField ? (
        <Textfield
          id="confirm-email-token"
          label={confirmEmail.tokenField.label}
          type="text"
          value={tokenValue}
          onChange={handleTokenInputChange}
          required
          disabled={isSubmitting}
          readOnly={tokenFieldIsReadOnly}
          aria-readonly={tokenFieldIsReadOnly}
          description={tokenFieldIsReadOnly ? confirmEmail.readonlyHint?.token : undefined}
          wrapperClassName="confirm-email-email-field"
        />
      ) : null}
      {shouldRenderConfirmButton ? (
        <Button
          variant="solid"
          size="md"
          text={confirmEmail.cta.confirm}
          className="confirm-email-confirm-button"
          type="button"
          onClick={handleConfirmClick}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      ) : null}
      {translatedError ? (
        <Warning message={translatedError} variant="error" />
      ) : null}
      {effectiveSuccessMessage ? (
        <Warning message={effectiveSuccessMessage} variant="success" />
      ) : null}
    </div>
  );
}
