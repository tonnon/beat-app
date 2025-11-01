import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent } from 'react';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import Textfield from '@/components/textfield/Textfield';
import Checkbox from '@/components/checkbox/Checkbox';
import Link from '@/components/link/Link';
import Warning from '@/components/warning/Warning';
import { registerUser, ApiError } from '@/services/auth/authService';
import { useApiErrorTranslation } from '@/hooks/useApiErrorTranslation';

import './singup.scss';

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
  readonly onUserIdReceived?: (userId: string) => void;
  readonly onShowTerms: () => void;
  readonly onShowPrivacy: () => void;
  readonly termsAccepted: boolean;
  readonly privacyAccepted: boolean;
  readonly onTermsAcceptedChange: (accepted: boolean) => void;
  readonly onPrivacyAcceptedChange: (accepted: boolean) => void;
  readonly onContinueToInformedConsent: () => void;
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
  onUserIdReceived,
  onShowTerms,
  onShowPrivacy,
  termsAccepted,
  privacyAccepted,
  onTermsAcceptedChange,
  onPrivacyAcceptedChange,
  onContinueToInformedConsent,
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

  const onErrorChangeRef = useRef(onErrorChange);
  
  useEffect(() => {
    onErrorChangeRef.current = onErrorChange;
  }, [onErrorChange]);

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      updateSubmitting(false);
      if (data?.userId) {
        onUserIdReceived?.(data.userId);
      }
      onContinueToInformedConsent();
    },
    onError: (err: Error) => {
      updateSubmitting(false);
      
      if (err instanceof ApiError) {
        const translatedError = translateApiError(err.originalMessage);
        updateError(translatedError, err.originalMessage);
      } else {
        const errorMessage = err.message || t('signupScreen.errors.registrationFailed');
        updateError(errorMessage, errorMessage);
      }
    },
  });

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    setInviteCode(initialInviteCode);
  }, [initialInviteCode]);

  useEffect(() => {
    setPassword(initialPassword);
  }, [initialPassword]);

  useEffect(() => {
    setConfirmPassword(initialConfirmPassword);
  }, [initialConfirmPassword]);

  useEffect(() => {
    if (rawError) {
      const translatedError = translateApiError(rawError);
      setError(translatedError);
      if (onErrorChangeRef.current) {
        onErrorChangeRef.current(translatedError);
      }
    }
  }, [i18n.language, rawError]);

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

  const handleEmailChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextEmail = event.target.value;
    setEmail(nextEmail);
    onEmailChange?.(nextEmail);
    updateError(null);
  }, [onEmailChange, updateError]);

  const handleInviteCodeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextInviteCode = event.target.value;
    setInviteCode(nextInviteCode);
    onInviteCodeChange?.(nextInviteCode);
    updateError(null);
  }, [onInviteCodeChange, updateError]);

  const handlePasswordChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextPassword = event.target.value;
    setPassword(nextPassword);
    onPasswordChange?.(nextPassword);
    updateError(null);
  }, [onPasswordChange, updateError]);

  const handleConfirmPasswordChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextConfirmPassword = event.target.value;
    setConfirmPassword(nextConfirmPassword);
    onConfirmPasswordChange?.(nextConfirmPassword);
    updateError(null);
  }, [onConfirmPasswordChange, updateError]);

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

    const hasEmptyFields = !trimmedEmail || !trimmedInviteCode || !trimmedPassword || !trimmedConfirmPassword;

    if (hasEmptyFields) {
      updateError(null);
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      updateError(t('signupScreen.errors.requiredFields'));
      return;
    }

    if (trimmedPassword.length < 8) {
      updateError(t('signupScreen.errors.passwordTooShort'));
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      updateError(t('signupScreen.errors.passwordMismatch'));
      return;
    }

    updateError(null);
    updateSubmitting(true);

    registerMutation.mutate({
      email: trimmedEmail,
      codeCompany: trimmedInviteCode,
      password: trimmedPassword,
      locale: i18n.language,
    });
  }, [confirmPassword, email, i18n.language, inviteCode, isSubmitting, password, privacyAccepted, registerMutation, t, termsAccepted, updateError, updateSubmitting]);

  const termsAgreementLabel = useMemo(() => (
    <>
      {t('signupScreen.agreements.terms.prefix')}
      <Link
        to={t('signupScreen.agreements.terms.href')}
        label={t('signupScreen.agreements.terms.link')}
        variant="subtle"
        onClick={handleTermsLinkClick}
      />
      {t('signupScreen.agreements.terms.suffix')}
    </>
  ), [handleTermsLinkClick, t]);

  const privacyAgreementLabel = useMemo(() => (
    <>
      {t('signupScreen.agreements.privacy.prefix')}
      <Link
        to={t('signupScreen.agreements.privacy.href')}
        label={t('signupScreen.agreements.privacy.link')}
        variant="subtle"
        onClick={handlePrivacyLinkClick}
      />
      {t('signupScreen.agreements.privacy.suffix')}
    </>
  ), [handlePrivacyLinkClick, t]);

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
            disabled={isSubmitting}
            required
          />
          <Textfield
            label={t('signupScreen.invitationCode.label')}
            placeholder={t('signupScreen.invitationCode.placeholder')}
            id="signup-invite-code"
            name="signup-invite-code"
            value={inviteCode}
            onChange={handleInviteCodeChange}
            disabled={isSubmitting}
            required
          />
          <Textfield
            label={t('password.label')}
            placeholder={t('signupScreen.password.placeholder')}
            type="password"
            id="signup-password"
            name="signup-password"
            autoComplete="new-password"
            value={password}
            onChange={handlePasswordChange}
            disabled={isSubmitting}
            required
          />
          <Textfield
            label={t('signupScreen.confirmPassword.label')}
            placeholder={t('signupScreen.confirmPassword.placeholder')}
            type="password"
            id="signup-confirm-password"
            name="signup-confirm-password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            disabled={isSubmitting}
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
        <Checkbox
          wrapperClassName="auth-agreement"
          label={termsAgreementLabel}
          disabled={isSubmitting}
          checked={termsAccepted}
          onCheckedChange={handleTermsCheckedChange}
        />
        <Checkbox
          wrapperClassName="auth-agreement"
          label={privacyAgreementLabel}
          disabled={isSubmitting}
          checked={privacyAccepted}
          onCheckedChange={handlePrivacyCheckedChange}
        />
      </div>
    </div>
  );
}
