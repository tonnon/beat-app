import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Textfield from '@/components/textfield/Textfield';
import Link from '@/components/link/Link';
import Warning from '@/components/warning/Warning';
import { useAuthDialog } from '@/context/auth/useAuthDialog';
import { useAuthStore } from '@/stores/authStore';
import { loginUser, ApiError } from '@/services/auth/authService';
import { useUserData } from '@/hooks/userData';
import { useApiErrorTranslation } from '@/hooks/useApiErrorTranslation';
import { getDestinationForRole } from '@/services/auth/roleRedirect';
import './login.scss';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUIRED_FIELDS_ERROR_KEY = 'signupScreen.errors.requiredFields';
const INVALID_FIELDS_ERROR_KEY = 'signupScreen.errors.invalidFields';

type FieldErrorStateOverrides = {
  emailError?: boolean;
  passwordError?: boolean;
  emailValue?: string;
  passwordValue?: string;
};

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

  const computeEmailErrorMessage = useCallback((value: string): string | null => {
    const trimmed = value.trim();

    if (!trimmed) {
      return t(REQUIRED_FIELDS_ERROR_KEY);
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      return t(INVALID_FIELDS_ERROR_KEY);
    }

    return null;
  }, [t]);

  const computePasswordErrorMessage = useCallback((value: string): string | null => {
    const trimmed = value.trim();

    if (!trimmed) {
      return t(REQUIRED_FIELDS_ERROR_KEY);
    }

    return null;
  }, [t]);

  const syncFieldErrorMessage = useCallback((overrides: FieldErrorStateOverrides = {}) => {
    const nextEmailError = overrides.emailError ?? emailError;
    const nextPasswordError = overrides.passwordError ?? passwordError;
    const nextEmailValue = overrides.emailValue ?? email;
    const nextPasswordValue = overrides.passwordValue ?? password;

    if (nextEmailError) {
      const message = computeEmailErrorMessage(nextEmailValue);
      if (message) {
        setError(message);
        return;
      }
    }

    if (nextPasswordError) {
      const message = computePasswordErrorMessage(nextPasswordValue);
      if (message) {
        setError(message);
        return;
      }
    }

    setError(null);
  }, [computeEmailErrorMessage, computePasswordErrorMessage, email, emailError, password, passwordError]);

  const handleEmailChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextEmail = event.target.value;
    setEmail(nextEmail);
    setEmailError(false);
    syncFieldErrorMessage({ emailError: false, emailValue: nextEmail });
    onEmailChange?.(nextEmail);
  }, [onEmailChange, syncFieldErrorMessage]);

  const handlePasswordChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextPassword = event.target.value;
    setPassword(nextPassword);
    setPasswordError(false);
    syncFieldErrorMessage({ passwordError: false, passwordValue: nextPassword });
  }, [syncFieldErrorMessage]);

  const handleEmailBlur = useCallback(() => {
    const trimmedEmail = email.trim();
    const validationMessage = computeEmailErrorMessage(trimmedEmail);

    if (validationMessage) {
      setEmailError(true);
      setError(validationMessage);
      return;
    }

    setEmailError(false);
    syncFieldErrorMessage({ emailError: false, emailValue: trimmedEmail });
  }, [computeEmailErrorMessage, email, syncFieldErrorMessage]);

  const handlePasswordBlur = useCallback(() => {
    const trimmedPassword = password.trim();
    const validationMessage = computePasswordErrorMessage(trimmedPassword);

    if (validationMessage) {
      setPasswordError(true);
      setError(validationMessage);
      return;
    }

    setPasswordError(false);
    syncFieldErrorMessage({ passwordError: false, passwordValue: trimmedPassword });
  }, [computePasswordErrorMessage, password, syncFieldErrorMessage]);

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
      syncFieldErrorMessage({
        emailError: hasEmailError,
        passwordError: hasPasswordError,
        emailValue: trimmedEmail,
        passwordValue: trimmedPassword,
      });
      return;
    }

    syncFieldErrorMessage({ emailError: false, passwordError: false, emailValue: trimmedEmail, passwordValue: trimmedPassword });

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
  }, [email, isSubmitting, password, setAccessToken, setRefreshToken, syncFieldErrorMessage, t, translateApiError, updateSubmitting]);

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
