import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Textfield from '@/components/textfield/Textfield';
import Warning from '@/components/warning/Warning';
import { requestPasswordReset, ApiError } from '@/services/auth/authService';
import { useApiErrorTranslation } from '@/hooks/useApiErrorTranslation';

import './forgot-password.scss';

interface ForgotPasswordProps {
  readonly formId: string;
  readonly initialEmail?: string;
  readonly onSubmittingChange?: (isSubmitting: boolean) => void;
  readonly onEmailChange?: (email: string) => void;
}

export default function ForgotPassword({
  formId,
  initialEmail = '',
  onSubmittingChange,
  onEmailChange,
}: ForgotPasswordProps) {
  const { t } = useTranslation<'auth'>('auth');
  const { translateApiError } = useApiErrorTranslation();

  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setEmail(initialEmail);
    setEmailError(false);
    setError(null);
    setSuccess(null);
  }, [initialEmail]);

  const updateSubmitting = useCallback((nextSubmitting: boolean) => {
    setIsSubmitting(nextSubmitting);
    onSubmittingChange?.(nextSubmitting);
  }, [onSubmittingChange]);

  const handleEmailChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextEmail = event.target.value;
    setEmail(nextEmail);
    setEmailError(false);
    setError(null);
    setSuccess(null);
    onEmailChange?.(nextEmail);
  }, [onEmailChange]);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const trimmedEmail = email.trim();
    const hasEmailError = trimmedEmail === '';

    setEmailError(hasEmailError);

    if (hasEmailError) {
      return;
    }

    updateSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await requestPasswordReset({ email: trimmedEmail });
      setSuccess(t('forgotPasswordScreen.success'));
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(translateApiError(caughtError.originalMessage));
      } else if (caughtError instanceof Error) {
        setError(translateApiError(caughtError.message));
      } else {
        setError(t('errors.generic'));
      }
    } finally {
      updateSubmitting(false);
    }
  }, [email, isSubmitting, t, translateApiError, updateSubmitting]);

  return (
    <div className="forgot-password-container">
      <form
        id={formId}
        className="auth-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="auth-fields">
          <Textfield
            label={t('email.label')}
            placeholder={t('email.placeholder')}
            type="email"
            id="forgot-email"
            name="forgot-email"
            autoComplete="email"
            value={email}
            onChange={handleEmailChange}
            disabled={isSubmitting}
            error={emailError}
            required
          />
        </div>
      </form>
      {success ? <Warning variant="success" message={success} /> : null}
      {error ? <Warning variant="error" message={error} /> : null}
    </div>
  );
}
