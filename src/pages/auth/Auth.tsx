import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import Dialog from '@/components/dialog/Dialog';
import { useAuthDialog } from '@/context/auth/AuthDialogContext';
import Button from '@/components/button/Button';
import { ArrowLeftIcon } from '@/components/icons/Icons';
import { useTranslation } from 'react-i18next';
import Login from './login/Login';
import ForgotPassword from './forgot-password/ForgotPassword';
import Singup from './singup/Singup';
import TermsOfUse from './terms-of-use/TermsOfUse';
import PrivacyPolicy from './privacy-policy/PrivacyPolicy';
import { InformedConsentFooter } from './informed-consent/InformedConsent';
import ConfirmEmail from './confirm-email/ConfirmEmail';
import InformedConsentText from './informed-consent/informed-consent-text/InformedConsentText';
import SingupSuccess from './singup-success/SingupSuccess';
import type { TermsOfUseSection } from './terms-of-use/TermsOfUse';
import { confirmEmail, type ConfirmEmailPayload, ApiError } from '@/services/auth/authService';
import './auth.scss';

type AuthView = 'login' | 'forgotPassword' | 'signup' | 'termsOfUse' | 'privacyPolicy' | 'informedConsent' | 'informedConsentText' | 'confirmEmail' | 'signupSuccess';

type TermsOfUseTranslation = {
  readonly title: string;
  readonly subtitle: string;
  readonly sections?: readonly TermsOfUseSection[];
};

type ConfirmEmailErrorKey = 'confirmEmail.errors.invalidEmailOrCode' | 'errors.generic';

export default function Auth() {
  const { t } = useTranslation<'auth'>('auth');
  const { isOpen, setDialogOpen } = useAuthDialog();

  const termsOfUseTranslation = t('termsOfUse', { returnObjects: true }) as TermsOfUseTranslation;

  const privacyPolicyTranslation = t('privacyPolicy', {
    returnObjects: true,
    defaultValue: { title: '' },
  }) as { title: string };

  const [view, setView] = useState<AuthView>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupRawError, setSignupRawError] = useState<string | null>(null);
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [signupTermsAccepted, setSignupTermsAccepted] = useState(false);
  const [signupPrivacyAccepted, setSignupPrivacyAccepted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const formId = 'auth-dialog-form';
  const ICON_SIZE = 18;
  const trimmedUserId = useMemo(() => (userId ?? '').trim(), [userId]);

  const [confirmEmailErrorKey, setConfirmEmailErrorKey] = useState<ConfirmEmailErrorKey | null>(null);
  const [confirmEmailErrorMessage, setConfirmEmailErrorMessage] = useState<string | null>(null);

  const clearSignupErrors = useCallback(() => {
    setSignupError(null);
    setSignupRawError(null);
  }, []);

  const resetSignupState = useCallback(() => {
    setInviteCode('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setSignupSubmitting(false);
    setSignupTermsAccepted(false);
    setSignupPrivacyAccepted(false);
    clearSignupErrors();
  }, [clearSignupErrors]);

  const clearConfirmEmailError = useCallback(() => {
    setConfirmEmailErrorKey(null);
    setConfirmEmailErrorMessage(null);
  }, []);

  const detectConfirmEmailErrorKey = useCallback((message: string): ConfirmEmailErrorKey | null => {
    const normalized = message.trim().toLowerCase();

    if (!normalized) {
      return null;
    }

    if (normalized === 'invalid email or code' || (normalized.includes('invalid email') && normalized.includes('code'))) {
      return 'confirmEmail.errors.invalidEmailOrCode';
    }

    if (normalized.includes('correo electrónico') && normalized.includes('código') && normalized.includes('inválid')) {
      return 'confirmEmail.errors.invalidEmailOrCode';
    }

    if (normalized.includes('correu electrònic') && normalized.includes('codi') && normalized.includes('invàlid')) {
      return 'confirmEmail.errors.invalidEmailOrCode';
    }

    return null;
  }, []);

  const processConfirmEmailError = useCallback((rawMessage: string | null, fallbackKey?: ConfirmEmailErrorKey) => {
    if (rawMessage) {
      const detectedKey = detectConfirmEmailErrorKey(rawMessage);

      if (detectedKey) {
        setConfirmEmailErrorKey(detectedKey);
        setConfirmEmailErrorMessage(null);
        return;
      }

      setConfirmEmailErrorKey(null);
      setConfirmEmailErrorMessage(rawMessage);
      return;
    }

    if (fallbackKey) {
      setConfirmEmailErrorKey(fallbackKey);
      setConfirmEmailErrorMessage(null);
      return;
    }

    clearConfirmEmailError();
  }, [clearConfirmEmailError, detectConfirmEmailErrorKey]);

  const confirmEmailMutation = useMutation({
    mutationFn: confirmEmail,
    onSuccess: () => {
      clearConfirmEmailError();
      setView('signupSuccess');
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        processConfirmEmailError(error.originalMessage);
        return;
      }

      if (error instanceof Error) {
        processConfirmEmailError(error.message);
        return;
      }

      processConfirmEmailError(null, 'errors.generic');
    },
  });

  useEffect(() => {
    if (view === 'termsOfUse' || view === 'privacyPolicy') {
      const dialogBody = document.querySelector<HTMLElement>('.dialog-body');

      dialogBody?.scrollTo({ top: 0 });
    }
  }, [view]);

  const handleLoginEmailChange = useCallback((nextEmail: string) => {
    setLoginEmail(nextEmail);
  }, []);

  const handleLoginSubmittingChange = useCallback((submitting: boolean) => {
    setLoginSubmitting(submitting);
  }, []);

  const handleNavigateToForgotPassword = useCallback((emailFromLogin: string) => {
    setForgotEmail(emailFromLogin);
    setForgotSubmitting(false);
    setView('forgotPassword');
  }, []);

  const handleRegisterClick = useCallback(() => {
    setSignupEmail(loginEmail);
    resetSignupState();
    setView('signup');
  }, [loginEmail, resetSignupState]);

  const resetForgotState = useCallback(() => {
    setForgotSubmitting(false);
  }, []);

  const handleBackToLogin = useCallback(() => {
    setView('login');
    setLoginSubmitting(false);
    resetForgotState();
    resetSignupState();
    clearConfirmEmailError();
  }, [clearConfirmEmailError, resetForgotState, resetSignupState]);

  const handleShowTerms = useCallback(() => {
    clearSignupErrors();
    setView('termsOfUse');
  }, [clearSignupErrors]);

  const handleBackFromTerms = useCallback(() => {
    setView('signup');
  }, []);

  const handleShowPrivacy = useCallback(() => {
    clearSignupErrors();
    setView('privacyPolicy');
  }, [clearSignupErrors]);

  const handleContinueToInformedConsent = useCallback(() => {
    setSignupSubmitting(false);
    setView('informedConsent');
  }, []);

  const handleUserIdReceived = useCallback((id: string) => {
    setUserId(id);
  }, []);

  const handleBackFromInformedConsent = useCallback(() => {
    setView('signup');
    setSignupSubmitting(false);
  }, []);

  const handleConsentConfirmed = useCallback(() => {
    setView('confirmEmail');
    clearConfirmEmailError();
    confirmEmailMutation.reset();
  }, [clearConfirmEmailError, confirmEmailMutation]);

  const handleConfirmEmailUserIdChange = useCallback((id: string) => {
    setUserId(id);
    clearConfirmEmailError();
  }, [clearConfirmEmailError]);

  const handleConfirmEmailSubmit = useCallback(() => {
    const trimmedEmail = signupEmail.trim();

    if (!trimmedUserId || !trimmedEmail) {
      return;
    }

    const payload: ConfirmEmailPayload = {
      email: trimmedEmail,
      code: trimmedUserId,
    };

    clearConfirmEmailError();
    confirmEmailMutation.mutate(payload);
  }, [clearConfirmEmailError, confirmEmailMutation, signupEmail, trimmedUserId]);

  const handleShowConsentText = useCallback(() => {
    setView('informedConsentText');
  }, []);

  const handleBackFromConsentText = useCallback(() => {
    setView('informedConsent');
  }, []);


  const handleSignupTermsAcceptedChange = useCallback((accepted: boolean) => {
    setSignupTermsAccepted(accepted);
  }, []);

  const handleSignupPrivacyAcceptedChange = useCallback((accepted: boolean) => {
    setSignupPrivacyAccepted(accepted);
  }, []);


  const handleBackFromPrivacy = useCallback(() => {
    setView('signup');
  }, []);

  const handleForgotEmailChange = useCallback((nextEmail: string) => {
    setForgotEmail(nextEmail);
    setLoginEmail(nextEmail);
  }, []);

  const handleForgotSubmittingChange = useCallback((submitting: boolean) => {
    setForgotSubmitting(submitting);
  }, []);

  const handleSignupEmailChange = useCallback((nextEmail: string) => {
    setSignupEmail(nextEmail);
    setLoginEmail(nextEmail);
    clearSignupErrors();
  }, [clearSignupErrors]);

  const handleInviteCodeChange = useCallback((nextInviteCode: string) => {
    setInviteCode(nextInviteCode);
    clearSignupErrors();
  }, [clearSignupErrors]);

  const handleSignupPasswordChange = useCallback((nextPassword: string) => {
    setSignupPassword(nextPassword);
    clearSignupErrors();
  }, [clearSignupErrors]);

  const handleSignupConfirmPasswordChange = useCallback((nextConfirmPassword: string) => {
    setSignupConfirmPassword(nextConfirmPassword);
    clearSignupErrors();
  }, [clearSignupErrors]);

  const handleSignupErrorChange = useCallback((nextError: string | null) => {
    setSignupError(nextError);
  }, []);

  const handleSignupRawErrorChange = useCallback((nextRawError: string | null) => {
    setSignupRawError(nextRawError);
  }, []);

  const handleSignupSubmittingChange = useCallback((submitting: boolean) => {
    setSignupSubmitting(submitting);
  }, []);

  const renderActionsWrapper = useCallback((
    buttons: ReactNode,
    {
      contentAlign,
      buttonsAlign,
      supportText,
    }: {
      contentAlign?: 'start' | 'end';
      buttonsAlign?: 'start' | 'end';
      supportText?: ReactNode;
    } = {}
  ): ReactNode => {
    const contentClassName = contentAlign
      ? `dialog-actions-content dialog-actions-content--align-${contentAlign}`
      : 'dialog-actions-content';
    const buttonsClassName = buttonsAlign
      ? `dialog-actions-buttons dialog-actions-buttons--align-${buttonsAlign}`
      : 'dialog-actions-buttons';

    return (
      <div className={contentClassName}>
        {supportText ?? null}
        <div className={buttonsClassName}>
          {buttons}
        </div>
      </div>
    );
  }, []);

  const dialogActions = useMemo<ReactNode>(() => {
    const backIcon = <ArrowLeftIcon size={ICON_SIZE} />;

    switch (view) {
      case 'forgotPassword':
        return renderActionsWrapper(
          <>
            <Button
              variant="border"
              size="md"
              text={t('back')}
              icon={backIcon}
              iconPosition="left"
              className="dialog-actions-secondary"
              type="button"
              onClick={handleBackToLogin}
              disabled={forgotSubmitting}
            />
            <Button
              variant="solid"
              size="md"
              text={t('forgotPasswordScreen.submit')}
              className="dialog-actions-primary"
              type="submit"
              form={formId}
              loading={forgotSubmitting}
              disabled={forgotSubmitting}
            />
          </>
        );

      case 'signup':
        return renderActionsWrapper(
          <>
            <Button
              variant="border"
              size="md"
              text={t('back')}
              className="dialog-actions-secondary"
              type="button"
              onClick={handleBackToLogin}
              icon={backIcon}
              iconPosition="left"
              disabled={signupSubmitting}
            />
            <Button
              variant="solid"
              size="md"
              text={t('submit')}
              className="dialog-actions-primary"
              type="submit"
              form={formId}
              loading={signupSubmitting}
              disabled={signupSubmitting || !signupTermsAccepted || !signupPrivacyAccepted}
            />
          </>
        );

      case 'termsOfUse':
        return renderActionsWrapper(
          <Button
            variant="border"
            size="md"
            text={t('back')}
            className="dialog-actions-secondary"
            type="button"
            onClick={handleBackFromTerms}
            icon={backIcon}
            iconPosition="left"
          />,
          { contentAlign: 'start', buttonsAlign: 'start' }
        );

      case 'privacyPolicy':
        return renderActionsWrapper(
          <Button
            variant="border"
            size="md"
            text={t('back')}
            className="dialog-actions-secondary"
            type="button"
            onClick={handleBackFromPrivacy}
            icon={backIcon}
            iconPosition="left"
          />,
          { contentAlign: 'start', buttonsAlign: 'start' }
        );

      case 'informedConsent':
        return (
          <InformedConsentFooter
            formId={formId}
            userId={userId}
            onShowConsentText={handleShowConsentText}
            onBack={handleBackFromInformedConsent}
            onSuccess={handleConsentConfirmed}
          />
        );

      case 'confirmEmail':
        return renderActionsWrapper(
          <Button
            variant="solid"
            size="md"
            text={t('confirmEmail.cta.confirm')}
            className="dialog-actions-primary"
            type="button"
            onClick={handleConfirmEmailSubmit}
            loading={confirmEmailMutation.isPending}
            disabled={!trimmedUserId || confirmEmailMutation.isPending}
          />,
          { contentAlign: 'end', buttonsAlign: 'end' }
        );

      case 'informedConsentText':
        return renderActionsWrapper(
          <Button
            variant="border"
            size="md"
            text={t('back')}
            className="dialog-actions-secondary"
            type="button"
            onClick={handleBackFromConsentText}
            icon={backIcon}
            iconPosition="left"
          />,
          { contentAlign: 'start', buttonsAlign: 'start' }
        );

      case 'signupSuccess':
        return renderActionsWrapper(
          <Button
            variant="solid"
            size="md"
            text={t('signupSuccess.cta')}
            className="dialog-actions-primary"
            type="button"
            onClick={handleBackToLogin}
          />,
          { contentAlign: 'end', buttonsAlign: 'end' }
        );

      default:
        return renderActionsWrapper(
          <>
            <Button
              variant="border"
              size="md"
              text={t('register')}
              className="dialog-actions-secondary"
              type="button"
              onClick={handleRegisterClick}
            />
            <Button
              variant="solid"
              size="md"
              text={t('submit')}
              className="dialog-actions-primary"
              type="submit"
              form={formId}
              loading={loginSubmitting}
              disabled={loginSubmitting}
            />
          </>,
          {
            supportText: (
              <span className="dialog-actions-support-text">
                {t('prompt.question')}
              </span>
            ),
          }
        );
    }
  }, [
    confirmEmailMutation.isPending,
    forgotSubmitting,
    formId,
    handleBackFromConsentText,
    handleBackFromInformedConsent,
    handleBackFromPrivacy,
    handleBackFromTerms,
    handleBackToLogin,
    handleConfirmEmailSubmit,
    handleConsentConfirmed,
    handleRegisterClick,
    handleShowConsentText,
    loginSubmitting,
    renderActionsWrapper,
    signupPrivacyAccepted,
    signupSubmitting,
    signupTermsAccepted,
    t,
    trimmedUserId,
    userId,
    view,
  ]);

  const dialogTitle = view === 'termsOfUse'
    ? termsOfUseTranslation.title
    : view === 'privacyPolicy'
      ? privacyPolicyTranslation.title
    : view === 'informedConsent'
      ? t('informedConsent.title')
    : view === 'forgotPassword'
      ? t('forgotPasswordScreen.title')
      : view === 'signup'
        ? t('signupScreen.title')
        : view === 'confirmEmail'
          ? t('confirmEmail.title')
          : view === 'signupSuccess'
            ? ''
            : t('title');

  const dialogSubtitle = view === 'termsOfUse'
    ? termsOfUseTranslation.subtitle
    : view === 'privacyPolicy'
      ? ''
    : view === 'informedConsent'
      ? t('informedConsent.subtitle')
    : view === 'forgotPassword'
      ? t('forgotPasswordScreen.subtitle')
      : view === 'signup'
        ? t('signupScreen.subtitle')
        : view === 'confirmEmail'
          ? t('confirmEmail.subtitle')
          : view === 'signupSuccess'
            ? ''
            : t('subtitle');
  return (
    <>
      <Dialog
      isOpen={isOpen}
      onOpenChange={setDialogOpen}
      title={dialogTitle}
      subtitle={dialogSubtitle}
      actions={dialogActions}
    >
      {view === 'signup' ? (
        <Singup
          formId={formId}
          initialEmail={signupEmail}
          initialInviteCode={inviteCode}
          initialPassword={signupPassword}
          initialConfirmPassword={signupConfirmPassword}
          initialError={signupError}
          initialRawError={signupRawError}
          onEmailChange={handleSignupEmailChange}
          onInviteCodeChange={handleInviteCodeChange}
          onPasswordChange={handleSignupPasswordChange}
          onConfirmPasswordChange={handleSignupConfirmPasswordChange}
          onErrorChange={handleSignupErrorChange}
          onRawErrorChange={handleSignupRawErrorChange}
          onSubmittingChange={handleSignupSubmittingChange}
          onShowTerms={handleShowTerms}
          onShowPrivacy={handleShowPrivacy}
          termsAccepted={signupTermsAccepted}
          privacyAccepted={signupPrivacyAccepted}
          onTermsAcceptedChange={handleSignupTermsAcceptedChange}
          onPrivacyAcceptedChange={handleSignupPrivacyAcceptedChange}
          onContinueToInformedConsent={handleContinueToInformedConsent}
          onUserIdReceived={handleUserIdReceived}
        />
      ) : view === 'termsOfUse' ? (
        <TermsOfUse sections={termsOfUseTranslation.sections} />
      ) : view === 'privacyPolicy' ? (
        <PrivacyPolicy />
      ) : view === 'informedConsent' ? (
        null
      ) : view === 'confirmEmail' ? (
        <ConfirmEmail
          userId={userId ?? ''}
          onUserIdChange={handleConfirmEmailUserIdChange}
          errorTranslationKey={confirmEmailErrorKey}
          errorMessage={confirmEmailErrorMessage}
          isSubmitting={confirmEmailMutation.isPending}
        />
      ) : view === 'informedConsentText' ? (
        <InformedConsentText />
      ) : view === 'signupSuccess' ? (
        <SingupSuccess />
      ) : view === 'forgotPassword' ? (
        <ForgotPassword
          formId={formId}
          initialEmail={forgotEmail}
          onSubmittingChange={handleForgotSubmittingChange}
          onEmailChange={handleForgotEmailChange}
        />
      ) : (
        <Login
          formId={formId}
          onForgotPassword={handleNavigateToForgotPassword}
          onSubmittingChange={handleLoginSubmittingChange}
          onEmailChange={handleLoginEmailChange}
          initialEmail={loginEmail}
        />
      )}
    </Dialog>
    </>
  );
}
