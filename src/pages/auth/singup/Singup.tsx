import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent } from 'react';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import Textfield from '@/components/textfield/Textfield';
import Checkbox from '@/components/checkbox/Checkbox';
import Link from '@/components/link/Link';
import Warning from '@/components/warning/Warning';
import { QuestionIcon } from '@/components/icons/Icons';
import { checkEmail, checkCompanyCode, ApiError, type RegisterUserPayload } from '@/services/auth/authService';
import { useApiErrorTranslation } from '@/hooks/useApiErrorTranslation';
import Tooltip from '@/components/tooltip/Tooltip';
import PasswordStrength, { type PasswordStrengthLevel } from '@/components/password-strength/PasswordStrength';

import './singup.scss';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function computePasswordStrength(value: string): PasswordStrengthLevel | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const length = trimmedValue.length;
  const hasLowercase = /[a-z]/.test(trimmedValue);
  const hasUppercase = /[A-Z]/.test(trimmedValue);
  const hasNumber = /\d/.test(trimmedValue);
  const hasSymbol = /[^A-Za-z0-9]/.test(trimmedValue);
  const checksPassed = Number(hasLowercase) + Number(hasUppercase) + Number(hasNumber) + Number(hasSymbol);

  if (length < 8 || checksPassed < 3) {
    return 'weak';
  }

  if (checksPassed === 3) {
    return length >= 12 ? 'strong' : 'medium';
  }

  return length >= 10 ? 'strong' : 'medium';
}

function doPasswordsMismatch(passwordValue: string, confirmPasswordValue: string): boolean {
  const trimmedPassword = passwordValue.trim();
  const trimmedConfirm = confirmPasswordValue.trim();

  if (!trimmedConfirm) {
    return false;
  }

  return trimmedPassword !== trimmedConfirm;
}

type PendingRegistrationData = Pick<RegisterUserPayload, 'email' | 'codeCompany' | 'password'>;

type CheckEmailIntent = 'blur' | 'submit';

interface CheckEmailVariables {
  readonly email: string;
  readonly intent: CheckEmailIntent;
}

interface CheckCompanyCodeVariables {
  readonly code: string;
  readonly intent: CheckEmailIntent;
}

type FieldErrorOverrides = Partial<Record<'emailHasError' | 'inviteCodeHasError' | 'passwordHasError' | 'confirmPasswordHasError', boolean>>;

const INVALID_INVITE_CODE_RAW_MESSAGE = 'Invalid invitation code';

interface SingupProps {
  readonly formId: string;
  readonly initialEmail?: string;
  readonly initialInviteCode?: string;
  readonly initialPassword?: string;
  readonly initialConfirmPassword?: string;
  readonly initialError?: string | null;
  readonly initialRawError?: string | null;
  readonly onEmailChange?: (email: string) => void;
  readonly onInviteCodeChange?: (inviteCode: string) => void;
  readonly onPasswordChange?: (password: string) => void;
  readonly onConfirmPasswordChange?: (confirmPassword: string) => void;
  readonly onErrorChange?: (error: string | null) => void;
  readonly onRawErrorChange?: (rawError: string | null) => void;
  readonly onSubmittingChange?: (isSubmitting: boolean) => void;
  readonly onShowTerms: () => void;
  readonly onShowPrivacy: () => void;
  readonly termsAccepted: boolean;
  readonly privacyAccepted: boolean;
  readonly onTermsAcceptedChange: (accepted: boolean) => void;
  readonly onPrivacyAcceptedChange: (accepted: boolean) => void;
  readonly onContinueToInformedConsent: () => void;
  readonly onRegistrationDataReady?: (payload: PendingRegistrationData) => void;
}

export default function Singup({
  formId,
  initialEmail = '',
  initialInviteCode = '',
  initialPassword = '',
  initialConfirmPassword = '',
  initialError = null,
  initialRawError = null,
  onEmailChange,
  onInviteCodeChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onErrorChange,
  onRawErrorChange,
  onSubmittingChange,
  onShowTerms,
  onShowPrivacy,
  termsAccepted,
  privacyAccepted,
  onTermsAcceptedChange,
  onPrivacyAcceptedChange,
  onContinueToInformedConsent,
  onRegistrationDataReady,
}: SingupProps) {
  const { t, i18n } = useTranslation<'auth'>('auth');
  const { translateApiError } = useApiErrorTranslation();

  const [email, setEmail] = useState(initialEmail);
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [password, setPassword] = useState(initialPassword);
  const [confirmPassword, setConfirmPassword] = useState(initialConfirmPassword);
  const [error, setError] = useState<string | null>(initialError);
  const [rawError, setRawError] = useState<string | null>(initialRawError);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailHasError, setEmailHasError] = useState(false);
  const [inviteCodeHasError, setInviteCodeHasError] = useState(false);
  const [passwordHasError, setPasswordHasError] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthLevel | null>(computePasswordStrength(initialPassword));
  const [confirmPasswordHasError, setConfirmPasswordHasError] = useState(false);

  const onErrorChangeRef = useRef(onErrorChange);
  const onRegistrationDataReadyRef = useRef<SingupProps['onRegistrationDataReady']>(onRegistrationDataReady);
  const registrationDataRef = useRef<PendingRegistrationData | null>(null);
  const lastCheckedEmailRef = useRef<string>('');
  const lastCheckedCompanyCodeRef = useRef<string>('');
  const lastCompanyCodeValidityRef = useRef<boolean | null>(null);
  
  useEffect(() => {
    onErrorChangeRef.current = onErrorChange;
  }, [onErrorChange]);

  useEffect(() => {
    onRegistrationDataReadyRef.current = onRegistrationDataReady;
  }, [onRegistrationDataReady]);

  const checkEmailMutation = useMutation<void, Error | ApiError, CheckEmailVariables>({
    mutationFn: async ({ email: emailToCheck }) => {
      await checkEmail(emailToCheck);
    },
    onSuccess: (_data, variables) => {
      const { intent, email: checkedEmail } = variables;
      const trimmedCurrentEmail = email.trim();

      if (intent === 'blur' && checkedEmail !== trimmedCurrentEmail) {
        return;
      }

      setEmailHasError(false);
      lastCheckedEmailRef.current = checkedEmail;

      if (intent === 'submit') {
        updateSubmitting(false);
        if (registrationDataRef.current) {
          onRegistrationDataReadyRef.current?.(registrationDataRef.current);
          registrationDataRef.current = null;
        }
        onContinueToInformedConsent();
        return;
      }

      if (rawError) {
        setRawError(null);
        onRawErrorChange?.(null);
      }

      if (error) {
        updateError(null);
      }
    },
    onError: (err, variables) => {
      const { intent, email: checkedEmail } = variables;
      const trimmedCurrentEmail = email.trim();

      if (intent === 'blur' && checkedEmail !== trimmedCurrentEmail) {
        return;
      }

      handleEmailCheckError(err);

      if (intent === 'submit') {
        updateSubmitting(false);
      }
    },
  });

  const checkCompanyCodeMutation = useMutation<boolean, Error | ApiError, CheckCompanyCodeVariables>({
    mutationFn: async ({ code }) => checkCompanyCode(code),
  });

  useEffect(() => {
    setEmail(initialEmail);
    setEmailHasError(false);
    lastCheckedEmailRef.current = '';
  }, [initialEmail]);

  useEffect(() => {
    setInviteCode(initialInviteCode);
    setInviteCodeHasError(false);
    lastCheckedCompanyCodeRef.current = '';
    lastCompanyCodeValidityRef.current = null;
  }, [initialInviteCode]);

  useEffect(() => {
    setPassword(initialPassword);
    setPasswordHasError(false);
    setPasswordStrength(computePasswordStrength(initialPassword));
  }, [initialPassword]);

  useEffect(() => {
    setConfirmPassword(initialConfirmPassword);
    setConfirmPasswordHasError(false);
  }, [initialConfirmPassword]);

  useEffect(() => {
    if (rawError) {
      const translatedError = translateApiError(rawError);
      const nextError = translatedError ?? rawError;
      setError(nextError);
      if (onErrorChangeRef.current) {
        onErrorChangeRef.current(nextError);
      }
    }
  }, [i18n.language, rawError, translateApiError]);

  const updateError = useCallback((nextError: string | null, nextRawError?: string | null) => {
    setError(nextError);
    onErrorChange?.(nextError);
    if (nextRawError !== undefined) {
      setRawError(nextRawError);
      onRawErrorChange?.(nextRawError);
    } else if (!nextError) {
      setRawError(null);
      onRawErrorChange?.(null);
    }
  }, [onErrorChange, onRawErrorChange]);

  const updateSubmitting = useCallback((nextSubmitting: boolean) => {
    setIsSubmitting(nextSubmitting);
    onSubmittingChange?.(nextSubmitting);
  }, [onSubmittingChange]);

  const handleEmailCheckError = useCallback((err: Error | ApiError) => {
    lastCheckedEmailRef.current = '';

    if (err instanceof ApiError) {
      const translatedError = translateApiError(err.originalMessage);
      const fallbackMessage = translatedError ?? err.originalMessage ?? t('signupScreen.errors.registrationFailed');
      setEmailHasError(true);
      updateError(fallbackMessage, err.originalMessage);
      return;
    }

    setEmailHasError(true);
    if (err instanceof Error) {
      const errorMessage = err.message || t('signupScreen.errors.registrationFailed');
      updateError(errorMessage, errorMessage);
      return;
    }

    setEmailHasError(false);
    updateError(t('signupScreen.errors.registrationFailed'));
  }, [translateApiError, t, updateError]);

  const handleInviteCodeCheckError = useCallback((err: Error | ApiError) => {
    lastCheckedCompanyCodeRef.current = '';
    lastCompanyCodeValidityRef.current = null;
    setInviteCodeHasError(true);

    if (err instanceof ApiError) {
      const translatedError = translateApiError(err.originalMessage);
      updateError(translatedError, err.originalMessage);
      return;
    }

    if (err instanceof Error) {
      const fallbackMessage = err.message || t('signupScreen.errors.registrationFailed');
      updateError(fallbackMessage, fallbackMessage);
      return;
    }

    updateError(t('signupScreen.errors.registrationFailed'));
  }, [t, translateApiError, updateError]);

  const validateEmailField = useCallback((value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return t('signupScreen.errors.requiredFields');
    }

    if (!trimmedValue.includes('@')) {
      return t('signupScreen.errors.emailMissingAt');
    }

    if (!EMAIL_REGEX.test(trimmedValue)) {
      return t('signupScreen.errors.invalidFields');
    }

    return null;
  }, [t]);

  const validateInviteCodeField = useCallback((value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return t('signupScreen.errors.requiredFields');
    }

    return null;
  }, [t]);

  const validatePasswordField = useCallback((value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return t('signupScreen.errors.requiredFields');
    }

    if (trimmedValue.length < 8) {
      return t('signupScreen.errors.passwordTooShort');
    }

    return null;
  }, [t]);

  const validateConfirmPasswordField = useCallback((value: string, referencePassword: string) => {
    const trimmedValue = value.trim();
    const trimmedPassword = referencePassword.trim();

    if (!trimmedValue) {
      return t('signupScreen.errors.requiredFields');
    }

    if (trimmedValue !== trimmedPassword) {
      return t('signupScreen.errors.passwordMismatch');
    }

    return null;
  }, [t]);


  const syncValidationErrors = useCallback((overrides: FieldErrorOverrides = {}) => {
    const nextEmailHasError = overrides.emailHasError ?? emailHasError;
    const nextInviteCodeHasError = overrides.inviteCodeHasError ?? inviteCodeHasError;
    const nextPasswordHasError = overrides.passwordHasError ?? passwordHasError;
    const nextConfirmPasswordHasError = overrides.confirmPasswordHasError ?? confirmPasswordHasError;

    if (nextEmailHasError) {
      const message = validateEmailField(email.trim());
      if (message) {
        updateError(message);
        return;
      }
    }

    if (nextInviteCodeHasError) {
      const message = validateInviteCodeField(inviteCode.trim());
      if (message) {
        updateError(message);
        return;
      }
    }

    if (nextPasswordHasError) {
      const message = validatePasswordField(password.trim());
      if (message) {
        updateError(message);
        return;
      }
    }

    if (nextConfirmPasswordHasError) {
      const message = validateConfirmPasswordField(confirmPassword.trim(), password.trim());
      if (message) {
        updateError(message);
        return;
      }
    }

    if (rawError) {
      const translated = translateApiError(rawError);
      updateError(translated, rawError);
      return;
    }

    updateError(null);
  }, [confirmPassword, confirmPasswordHasError, email, emailHasError, inviteCode, inviteCodeHasError, password, passwordHasError, rawError, translateApiError, updateError, validateConfirmPasswordField, validateEmailField, validateInviteCodeField, validatePasswordField]);

  const verifyInviteCode = useCallback(async (codeValue: string, intent: CheckEmailIntent) => {
    const trimmedCode = codeValue.trim();

    if (!trimmedCode) {
      return false;
    }

    if (trimmedCode === lastCheckedCompanyCodeRef.current && lastCompanyCodeValidityRef.current !== null) {
      return lastCompanyCodeValidityRef.current;
    }

    try {
      const isValid = await checkCompanyCodeMutation.mutateAsync({ code: trimmedCode, intent });

      if (trimmedCode !== inviteCode.trim()) {
        return isValid;
      }

      lastCheckedCompanyCodeRef.current = trimmedCode;
      lastCompanyCodeValidityRef.current = isValid;

      if (!isValid) {
        setInviteCodeHasError(true);
        const invalidMessage = translateApiError(INVALID_INVITE_CODE_RAW_MESSAGE);
        updateError(invalidMessage, INVALID_INVITE_CODE_RAW_MESSAGE);
      } else {
        setInviteCodeHasError(false);
        if (rawError === INVALID_INVITE_CODE_RAW_MESSAGE) {
          updateError(null);
        }
  syncValidationErrors({ inviteCodeHasError: false });
      }

      return isValid;
    } catch (err) {
      const normalizedError = err instanceof ApiError || err instanceof Error ? err : new Error(String(err));

      if (trimmedCode === inviteCode.trim()) {
        handleInviteCodeCheckError(normalizedError);
      }

      return false;
    }
  }, [
    checkCompanyCodeMutation,
  syncValidationErrors,
    handleInviteCodeCheckError,
    inviteCode,
    rawError,
    translateApiError,
    updateError,
  ]);
  const handleEmailChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextEmail = event.target.value;
    setEmail(nextEmail);
    onEmailChange?.(nextEmail);
    lastCheckedEmailRef.current = '';

    if (!emailHasError) {
      return;
    }

    const trimmedEmail = nextEmail.trim();
    const validationMessage = validateEmailField(trimmedEmail);

    if (validationMessage) {
      updateError(validationMessage);
      return;
    }

    setEmailHasError(false);
    syncValidationErrors({ emailHasError: false });
  }, [emailHasError, onEmailChange, syncValidationErrors, updateError, validateEmailField]);

  const handleInviteCodeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextInviteCode = event.target.value;
    setInviteCode(nextInviteCode);
    onInviteCodeChange?.(nextInviteCode);
    lastCheckedCompanyCodeRef.current = '';
    lastCompanyCodeValidityRef.current = null;

    if (!inviteCodeHasError) {
      return;
    }

    const validationMessage = validateInviteCodeField(nextInviteCode.trim());
    if (validationMessage) {
      updateError(validationMessage);
      return;
    }

    setInviteCodeHasError(false);
    syncValidationErrors({ inviteCodeHasError: false });
  }, [inviteCodeHasError, onInviteCodeChange, syncValidationErrors, updateError, validateInviteCodeField]);

  const handlePasswordChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextPassword = event.target.value;
    setPassword(nextPassword);
    setPasswordStrength(computePasswordStrength(nextPassword));
    onPasswordChange?.(nextPassword);

    if (!passwordHasError && !confirmPasswordHasError) {
      return;
    }

    const trimmedPassword = nextPassword.trim();
    const passwordValidationMessage = validatePasswordField(trimmedPassword);

    if (passwordValidationMessage) {
      setPasswordHasError(true);
      updateError(passwordValidationMessage);
      return;
    }

    const trimmedConfirmPassword = confirmPassword.trim();
    const confirmValidationMessage = confirmPasswordHasError
      ? validateConfirmPasswordField(trimmedConfirmPassword, trimmedPassword)
      : null;

    if (confirmValidationMessage) {
      setPasswordHasError(true);
      setConfirmPasswordHasError(true);
      updateError(confirmValidationMessage);
      return;
    }

    if (passwordHasError) {
      setPasswordHasError(false);
    }

    if (confirmPasswordHasError) {
      setConfirmPasswordHasError(false);
    }

    syncValidationErrors({ passwordHasError: false, confirmPasswordHasError: false });
  }, [confirmPassword, confirmPasswordHasError, onPasswordChange, passwordHasError, syncValidationErrors, updateError, validateConfirmPasswordField, validatePasswordField]);

  const handleConfirmPasswordChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextConfirmPassword = event.target.value;
    setConfirmPassword(nextConfirmPassword);
    onConfirmPasswordChange?.(nextConfirmPassword);

    if (!confirmPasswordHasError && !passwordHasError) {
      return;
    }

    const trimmedConfirmPassword = nextConfirmPassword.trim();
    const trimmedPassword = password.trim();

    const passwordValidationMessage = passwordHasError ? validatePasswordField(trimmedPassword) : null;
    if (passwordValidationMessage) {
      setPasswordHasError(true);
      updateError(passwordValidationMessage);
      return;
    }

    const confirmValidationMessage = validateConfirmPasswordField(trimmedConfirmPassword, trimmedPassword);

    if (confirmValidationMessage) {
      if (doPasswordsMismatch(trimmedPassword, trimmedConfirmPassword)) {
        setPasswordHasError(true);
      }
      setConfirmPasswordHasError(true);
      updateError(confirmValidationMessage);
      return;
    }

    if (confirmPasswordHasError) {
      setConfirmPasswordHasError(false);
    }

    if (passwordHasError) {
      setPasswordHasError(false);
    }

    syncValidationErrors({ confirmPasswordHasError: false, passwordHasError: false });
  }, [confirmPasswordHasError, onConfirmPasswordChange, password, passwordHasError, syncValidationErrors, updateError, validateConfirmPasswordField, validatePasswordField]);

  const handleEmailBlur = useCallback(() => {
    const trimmedEmail = email.trim();
    const validationMessage = validateEmailField(trimmedEmail);

    if (validationMessage) {
      setEmailHasError(true);
      updateError(validationMessage);
      return;
    }

  setEmailHasError(false);
  syncValidationErrors({ emailHasError: false });

    if (!trimmedEmail) {
      return;
    }

    if (trimmedEmail === lastCheckedEmailRef.current) {
      return;
    }

    if (checkEmailMutation.isPending) {
      return;
    }

    checkEmailMutation.mutate({ email: trimmedEmail, intent: 'blur' });
  }, [checkEmailMutation, email, syncValidationErrors, updateError, validateEmailField]);

  const handleInviteCodeBlur = useCallback(() => {
    const trimmedInviteCodeValue = inviteCode.trim();
    const validationMessage = validateInviteCodeField(trimmedInviteCodeValue);

    if (validationMessage) {
      setInviteCodeHasError(true);
      updateError(validationMessage);
      return;
    }

    void verifyInviteCode(trimmedInviteCodeValue, 'blur');
  }, [inviteCode, updateError, validateInviteCodeField, verifyInviteCode]);

  const handlePasswordBlur = useCallback(() => {
    const validationMessage = validatePasswordField(password);

    if (validationMessage) {
      setPasswordHasError(true);
      updateError(validationMessage);
      return;
    }

    if (doPasswordsMismatch(password, confirmPassword)) {
      setPasswordHasError(true);
      return;
    }

    setPasswordHasError(false);
    syncValidationErrors({ passwordHasError: false });
  }, [confirmPassword, password, syncValidationErrors, updateError, validatePasswordField]);

  const handleConfirmPasswordBlur = useCallback(() => {
    const validationMessage = validateConfirmPasswordField(confirmPassword, password);

    if (validationMessage) {
      setConfirmPasswordHasError(true);
      if (doPasswordsMismatch(password, confirmPassword)) {
        setPasswordHasError(true);
      }
      updateError(validationMessage);
      return;
    }

    setConfirmPasswordHasError(false);
    const passwordValidationMessage = validatePasswordField(password);
    if (!passwordValidationMessage) {
      setPasswordHasError(false);
      syncValidationErrors({ confirmPasswordHasError: false, passwordHasError: false });
    }
  }, [confirmPassword, password, syncValidationErrors, updateError, validateConfirmPasswordField, validatePasswordField]);

  const handleTermsLinkClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    updateError(null);
    onShowTerms();
  }, [onShowTerms, updateError]);

  const handlePrivacyLinkClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    updateError(null);
    onShowPrivacy();
  }, [onShowPrivacy, updateError]);

  const handleTermsCheckedChange = useCallback((checked: CheckedState) => {
    const isChecked = checked === true;
    onTermsAcceptedChange(isChecked);
    updateError(null);
  }, [onTermsAcceptedChange, updateError]);

  const handlePrivacyCheckedChange = useCallback((checked: CheckedState) => {
    const isChecked = checked === true;
    onPrivacyAcceptedChange(isChecked);
    updateError(null);
  }, [onPrivacyAcceptedChange, updateError]);

  const renderImportantLinkLabel = useCallback((labelText: string) => (
    <>
      {labelText}
      <span aria-hidden="true" className="app-textfield-required-indicator">*</span>
    </>
  ), []);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const form = event.currentTarget;
    const isFormValid = form.reportValidity();

    if (!isFormValid) {
      updateError(t('signupScreen.errors.invalidFields'));
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedInviteCode = inviteCode.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    setPasswordStrength(computePasswordStrength(trimmedPassword));

    const emailValidationMessage = validateEmailField(trimmedEmail);
    if (emailValidationMessage) {
      setEmailHasError(true);
      updateError(emailValidationMessage);
      return;
    }
    setEmailHasError(false);

    const inviteCodeValidationMessage = validateInviteCodeField(trimmedInviteCode);
    if (inviteCodeValidationMessage) {
      setInviteCodeHasError(true);
      updateError(inviteCodeValidationMessage);
      return;
    }

    const isInviteCodeValid = await verifyInviteCode(trimmedInviteCode, 'submit');
    if (!isInviteCodeValid) {
      return;
    }

    const passwordValidationMessage = validatePasswordField(trimmedPassword);
    if (passwordValidationMessage) {
      setPasswordHasError(true);
      updateError(passwordValidationMessage);
      return;
    }
    setPasswordHasError(false);

    const confirmPasswordValidationMessage = validateConfirmPasswordField(trimmedConfirmPassword, trimmedPassword);
    if (confirmPasswordValidationMessage) {
      setConfirmPasswordHasError(true);
      if (doPasswordsMismatch(trimmedPassword, trimmedConfirmPassword)) {
        setPasswordHasError(true);
      }
      updateError(confirmPasswordValidationMessage);
      return;
    }
    setConfirmPasswordHasError(false);

    if (!termsAccepted || !privacyAccepted) {
      updateError(t('signupScreen.errors.requiredFields'));
      return;
    }

    updateError(null);
    updateSubmitting(true);

    registrationDataRef.current = {
      email: trimmedEmail,
      codeCompany: trimmedInviteCode,
      password: trimmedPassword,
    };

    checkEmailMutation.mutate({ email: trimmedEmail, intent: 'submit' });
  }, [
    checkEmailMutation,
    confirmPassword,
    email,
    inviteCode,
    isSubmitting,
    password,
    privacyAccepted,
    t,
    termsAccepted,
    updateError,
    updateSubmitting,
    validateConfirmPasswordField,
    validateEmailField,
    validateInviteCodeField,
    validatePasswordField,
    verifyInviteCode,
  ]);

  const termsAgreementLabel = useMemo(() => (
    <>
      {t('signupScreen.agreements.terms.prefix')}
      <Link
        to={t('signupScreen.agreements.terms.href')}
        label={renderImportantLinkLabel(t('signupScreen.agreements.terms.link'))}
        variant="important"
        onClick={handleTermsLinkClick}
      />
      {t('signupScreen.agreements.terms.suffix')}
    </>
  ), [handleTermsLinkClick, renderImportantLinkLabel, t]);

  const privacyAgreementLabel = useMemo(() => (
    <>
      {t('signupScreen.agreements.privacy.prefix')}
      <Link
        to={t('signupScreen.agreements.privacy.href')}
        label={renderImportantLinkLabel(t('signupScreen.agreements.privacy.link'))}
        variant="important"
        onClick={handlePrivacyLinkClick}
      />
      {t('signupScreen.agreements.privacy.suffix')}
    </>
  ), [handlePrivacyLinkClick, renderImportantLinkLabel, t]);

  const agreementsTooltipMessage = t('signupScreen.agreements.tooltip');

  return (
    <div className="singup-container">
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
            id="signup-email"
            name="signup-email"
            autoComplete="email"
            value={email}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            disabled={isSubmitting}
            error={emailHasError}
            required
          />
          <Textfield
            label={t('signupScreen.invitationCode.label')}
            placeholder={t('signupScreen.invitationCode.placeholder')}
            id="signup-invite-code"
            name="signup-invite-code"
            value={inviteCode}
            onChange={handleInviteCodeChange}
            onBlur={handleInviteCodeBlur}
            disabled={isSubmitting}
            error={inviteCodeHasError}
            required
            labelIcon={(
              <Tooltip content={t('signupScreen.invitationCode.tooltip')}>
                <button
                  type="button"
                  className="app-textfield-label-icon-button"
                  aria-label={t('signupScreen.invitationCode.tooltip')}
                >
                  <QuestionIcon size={16} aria-hidden={true} />
                </button>
              </Tooltip>
            )}
          />
          <div className="singup-password-field">
            <Textfield
              label={t('password.label')}
              placeholder={t('signupScreen.password.placeholder')}
              type="password"
              id="signup-password"
              name="signup-password"
              autoComplete="new-password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={handlePasswordBlur}
              disabled={isSubmitting}
              error={passwordHasError}
              required
            />
            <PasswordStrength strength={passwordStrength} password={password} />
          </div>
          <Textfield
            label={t('signupScreen.confirmPassword.label')}
            placeholder={t('signupScreen.confirmPassword.placeholder')}
            type="password"
            id="signup-confirm-password"
            name="signup-confirm-password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            onBlur={handleConfirmPasswordBlur}
            disabled={isSubmitting}
            error={confirmPasswordHasError}
            required
          />
        </div>
      </form>
      {error ? <Warning variant="error" message={error} /> : null}
      <Warning
        variant="important"
        title={t('signupScreen.importantNotice.title')}
        message={t('signupScreen.importantNotice.message')}
      />
      <div className="auth-agreements">
        <Tooltip content={agreementsTooltipMessage} delayDuration={0}>
          <Checkbox
            wrapperClassName="auth-agreement"
            label={termsAgreementLabel}
            disabled
            checked={termsAccepted}
            onCheckedChange={handleTermsCheckedChange}
          />
        </Tooltip>
        <Tooltip content={agreementsTooltipMessage} delayDuration={0}>
          <Checkbox
            wrapperClassName="auth-agreement"
            label={privacyAgreementLabel}
            disabled
            checked={privacyAccepted}
            onCheckedChange={handlePrivacyCheckedChange}
          />
        </Tooltip>
      </div>
    </div>
  );
}
