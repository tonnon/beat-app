import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { MouseEvent } from 'react';
import Link from '@/components/link/Link';
import Warning from '@/components/warning/Warning';
import type esAuth from '@/locales/es/auth.json';
import './confirm-email.scss';

export type ConfirmEmailErrorTranslationKey = 'confirmEmail.errors.invalidEmailOrCode' | 'errors.generic';

type ConfirmEmailProps = {
  readonly onResendRequest?: () => void;
  readonly errorTranslationKey?: ConfirmEmailErrorTranslationKey | null;
  readonly errorMessage?: string | null;
};

export default function ConfirmEmail({ onResendRequest, errorTranslationKey, errorMessage }: ConfirmEmailProps) {
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
      {translatedError ? (
        <Warning message={translatedError} variant="error" />
      ) : null}
    </div>
  );
}
