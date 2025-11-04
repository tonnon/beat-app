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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUIRED_FIELDS_ERROR_KEY = 'signupScreen.errors.requiredFields';
const INVALID_FIELDS_ERROR_KEY = 'signupScreen.errors.invalidFields';

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
  const [fieldError, setFieldError] = useState<{ source: 'email' | 'password'; message: string } | null>(null);
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
    setFieldError(null);
  }, []);

  const handleEmailChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextEmail = event.target.value;
    setEmail(nextEmail);
    setEmailError(false);
    if (fieldError?.source === 'email') {
      setFieldError(null);
      setError(null);
    }
    onEmailChange?.(nextEmail);
  }, [fieldError?.source, onEmailChange]);

  const handlePasswordChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextPassword = event.target.value;
    setPassword(nextPassword);
    setPasswordError(false);
    if (fieldError?.source === 'password') {
      setFieldError(null);
      setError(null);
    }
  }, [fieldError?.source]);

  const handleEmailBlur = useCallback(() => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      const message = t(REQUIRED_FIELDS_ERROR_KEY);
      setEmailError(true);
      setFieldError({ source: 'email', message });
      setError(message);
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      const message = t(INVALID_FIELDS_ERROR_KEY);
      setEmailError(true);
      setFieldError({ source: 'email', message });
      setError(message);
      return;
    }

    setEmailError(false);
    if (fieldError?.source === 'email') {
      setFieldError(null);
      setError(null);
    }
  }, [email, fieldError?.source, t]);

  const handlePasswordBlur = useCallback(() => {
    const trimmedPassword = password.trim();

    if (!trimmedPassword) {
      const message = t(REQUIRED_FIELDS_ERROR_KEY);
      setPasswordError(true);
      setFieldError({ source: 'password', message });
      setError(message);
      return;
    }

    setPasswordError(false);
    if (fieldError?.source === 'password') {
      setFieldError(null);
      setError(null);
    }
  }, [fieldError?.source, password, t]);

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

    const hasEmailError = trimmedEmail === '' || !EMAIL_REGEX.test(trimmedEmail);
    const hasPasswordError = trimmedPassword === '';

    setEmailError(hasEmailError);
    setPasswordError(hasPasswordError);

    if (hasEmailError || hasPasswordError) {
      const message = hasEmailError
        ? t(trimmedEmail ? INVALID_FIELDS_ERROR_KEY : REQUIRED_FIELDS_ERROR_KEY)
        : t(REQUIRED_FIELDS_ERROR_KEY);
      setFieldError({ source: hasEmailError ? 'email' : 'password', message });
      setError(message);
      return;
    }

    if (fieldError) {
      setFieldError(null);
      setError(null);
    }

    updateSubmitting(true);
    setError(null);

    try {
      const { accessToken: nextAccessToken, refreshToken: nextRefreshToken } = await loginUser({ email: trimmedEmail, password: trimmedPassword });

      setPendingAccessToken(nextAccessToken);
      setAccessToken(nextAccessToken);
      setRefreshToken(nextRefreshToken);
    } catch (caughtError) {
      setEmailError(true);
      setPasswordError(true);

      setFieldError(null);

      const identificationFailedMessage = t('loginScreen.errors.identificationFailed');
      if (caughtError instanceof ApiError) {
        setError(identificationFailedMessage);
      } else if (caughtError instanceof Error) {
        const translatedMessage = translateApiError(caughtError.message);
        setError(translatedMessage || identificationFailedMessage);
      } else {
        setError(identificationFailedMessage);
      }

      setAccessToken(null);
      setRefreshToken(null);
      updateSubmitting(false);
    }
  }, [email, fieldError, isSubmitting, password, setAccessToken, setRefreshToken, t, translateApiError, updateSubmitting]);

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
  setFieldError(null);

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
      setFieldError(null);
      setError(translateApiError(userDataError.originalMessage));
      return;
    }

    if (userDataError instanceof Error) {
      setFieldError(null);
      setError(translateApiError(userDataError.message));
      return;
    }

    setFieldError(null);
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
            onBlur={handleEmailBlur}
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
            onBlur={handlePasswordBlur}
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
