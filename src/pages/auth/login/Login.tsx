import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Textfield from '@/components/textfield/Textfield';
import Link from '@/components/link/Link';
import Warning from '@/components/warning/Warning';
import { useAuthDialog } from '@/context/auth/AuthDialogContext';
import { useAuthStore } from '@/stores/authStore';
import { loginUser, ApiError } from '@/services/auth/authService';
import { useUserData } from '@/hooks/userData';
import { useApiErrorTranslation } from '@/hooks/useApiErrorTranslation';
import { getDestinationForRole } from '@/services/auth/roleRedirect';
import './login.scss';

interface LoginProps {
  readonly formId: string;
  readonly onForgotPassword: (email: string) => void;
  readonly onSubmittingChange?: (isSubmitting: boolean) => void;
  readonly onEmailChange?: (email: string) => void;
  readonly initialEmail?: string;
}

export default function Login({
  formId,
  onForgotPassword,
  onSubmittingChange,
  onEmailChange,
  initialEmail = '',
}: LoginProps) {
  const { t } = useTranslation<'auth'>('auth');
  const navigate = useNavigate();
  const { setDialogOpen } = useAuthDialog();
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setRefreshToken = useAuthStore((state) => state.setRefreshToken);
  const authenticate = useAuthStore((state) => state.authenticate);

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAccessToken, setPendingAccessToken] = useState<string | null>(null);
  const { translateApiError } = useApiErrorTranslation();

  const {
    data: fetchedUser,
    isSuccess: isUserLoaded,
    isError: isUserError,
    error: userDataError,
  } = useUserData(accessToken);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const updateSubmitting = useCallback((nextSubmitting: boolean) => {
    setIsSubmitting(nextSubmitting);
    onSubmittingChange?.(nextSubmitting);
  }, [onSubmittingChange]);

  const clearErrors = useCallback(() => {
    setError(null);
    setEmailError(false);
    setPasswordError(false);
  }, []);

  const handleEmailChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    setEmailError(false);
    setError(null);
    onEmailChange?.(event.target.value);
  }, [onEmailChange]);

  const handlePasswordChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    setPasswordError(false);
    setError(null);
  }, []);

  const handleForgotPasswordClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onForgotPassword(email);
    clearErrors();
  }, [clearErrors, email, onForgotPassword]);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    const hasEmailError = trimmedEmail === '';
    const hasPasswordError = trimmedPassword === '';

    setEmailError(hasEmailError);
    setPasswordError(hasPasswordError);

    if (hasEmailError || hasPasswordError) {
      return;
    }

    updateSubmitting(true);
    setError(null);

    try {
      const { accessToken: nextAccessToken, refreshToken: nextRefreshToken } = await loginUser({ email: trimmedEmail, password: trimmedPassword });

      setPendingAccessToken(nextAccessToken);
      setAccessToken(nextAccessToken);
      setRefreshToken(nextRefreshToken);
    } catch (caughtError) {
      setEmailError(false);
      setPasswordError(false);

      if (caughtError instanceof ApiError) {
        setError(translateApiError(caughtError.originalMessage));
      } else if (caughtError instanceof Error) {
        setError(translateApiError(caughtError.message));
      } else {
        setError(t('errors.generic'));
      }

      setAccessToken(null);
      setRefreshToken(null);
      updateSubmitting(false);
    }
  }, [email, isSubmitting, password, setAccessToken, setRefreshToken, t, translateApiError, updateSubmitting]);

  useEffect(() => {
    if (!pendingAccessToken || !isUserLoaded || !fetchedUser) {
      return;
    }

    authenticate({ accessToken: pendingAccessToken, refreshToken: refreshToken ?? null, user: fetchedUser });
    setPendingAccessToken(null);
    updateSubmitting(false);
    setDialogOpen(false);
    setEmail('');
    onEmailChange?.('');
    setPassword('');
    setEmailError(false);
    setPasswordError(false);

    const destination = getDestinationForRole(fetchedUser.role);

    if (destination && destination !== '/') {
      navigate(destination, { replace: true });
      return;
    }

    navigate('/', { replace: true });
  }, [authenticate, fetchedUser, isUserLoaded, navigate, onEmailChange, pendingAccessToken, refreshToken, setDialogOpen, updateSubmitting]);

  useEffect(() => {
    if (!pendingAccessToken || !isUserError) {
      return;
    }

    setPendingAccessToken(null);
    setAccessToken(null);
    setRefreshToken(null);
    updateSubmitting(false);

    if (userDataError instanceof ApiError) {
      setError(translateApiError(userDataError.originalMessage));
      return;
    }

    if (userDataError instanceof Error) {
      setError(translateApiError(userDataError.message));
      return;
    }

    setError(t('errors.generic'));
  }, [isUserError, pendingAccessToken, setAccessToken, setRefreshToken, t, translateApiError, updateSubmitting, userDataError]);

  return (
    <div className="login-container">
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
            id="auth-email"
            name="auth-email"
            autoComplete="username"
            value={email}
            onChange={handleEmailChange}
            disabled={isSubmitting}
            error={emailError}
            required
          />
          <Textfield
            placeholder={t('password.placeholder')}
            type="password"
            id="auth-password"
            name="auth-password"
            autoComplete="current-password"
            value={password}
            onChange={handlePasswordChange}
            disabled={isSubmitting}
            error={passwordError}
            required
            label={t('password.label')}
            labelSuffix={(
              <Link
                to="#forgot-password"
                label={t('forgotPassword')}
                variant="subtle"
                onClick={handleForgotPasswordClick}
              />
            )}
          />
        </div>
      </form>
      {error ? <Warning variant="error" message={error} /> : null}
    </div>
  );
}
