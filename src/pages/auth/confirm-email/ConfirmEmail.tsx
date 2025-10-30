import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChangeEvent, MouseEvent } from 'react';
import Link from '@/components/link/Link';
import Textfield from '@/components/textfield/Textfield';
import Warning from '@/components/warning/Warning';
import type esAuth from '@/locales/es/auth.json';
import './confirm-email.scss';

export type ConfirmEmailErrorTranslationKey = 'confirmEmail.errors.invalidEmailOrCode' | 'errors.generic';

type ConfirmEmailProps = {
  readonly userId: string;
  readonly onResendRequest?: () => void;
  readonly onUserIdChange?: (userId: string) => void;
  readonly errorTranslationKey?: ConfirmEmailErrorTranslationKey | null;
  readonly errorMessage?: string | null;
  readonly isSubmitting?: boolean;
};

export default function ConfirmEmail({ userId, onResendRequest, onUserIdChange, errorTranslationKey, errorMessage, isSubmitting = false }: ConfirmEmailProps) {
  const { t } = useTranslation<'auth'>('auth');
  const confirmEmail = useMemo(() => t('confirmEmail', { returnObjects: true }) as (typeof esAuth)['confirmEmail'], [t]);
  const translatedError = useMemo(() => {
    if (errorTranslationKey) {
      return t(errorTranslationKey);
    }

    return errorMessage ?? null;
  }, [errorMessage, errorTranslationKey, t]);

  const handleResendClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onResendRequest?.();
  };

  const handleUserIdInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onUserIdChange?.(event.target.value);
  };

  return (
    <div className="confirm-email">
      <p className="confirm-email-message">
        {confirmEmail.bodyPrefix}
        <Link
          to="#"
          label={confirmEmail.linkLabel}
          variant="subtle"
          className="confirm-email-resend-link"
          onClick={handleResendClick}
        />
        {confirmEmail.bodySuffix}
      </p>
      <Textfield
        id="confirm-email-user-id"
        label={confirmEmail.userIdField.label}
        value={userId}
        onChange={handleUserIdInputChange}
        required
        disabled={isSubmitting}
        wrapperClassName="confirm-email-user-id-field"
      />
      {translatedError ? (
        <Warning message={translatedError} variant="error" />
      ) : null}
    </div>
  );
}
