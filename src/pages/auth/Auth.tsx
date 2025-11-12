import { useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import Dialog from '@/components/dialog/Dialog';
import ProgressLinear from '@/components/progress/progress-linear/ProgressLinear';
import { useAuthDialog } from '@/context/auth/useAuthDialog';
import Button from '@/components/button/Button';
import { ArrowLeftIcon } from '@/components/icons/Icons';
import { useTranslation } from 'react-i18next';
import Login from './login/Login';
import ForgotPassword from './forgot-password/ForgotPassword';
import Singup from './singup/Singup';
import TermsOfUse, { type TermsOfUseSection } from './terms-of-use/TermsOfUse';
import PrivacyPolicy from './privacy-policy/PrivacyPolicy';
import { InformedConsentFooter } from './informed-consent/InformedConsent';
import ConfirmEmail from './confirm-email/ConfirmEmail';
import InformedConsentText from './informed-consent/informed-consent-text/InformedConsentText';
import SingupSuccess from './singup-success/SingupSuccess';
import ConfirmEmailSuccess from './confirm-email/ConfirmEmailSuccess';
import { confirmEmail, type ConfirmEmailPayload, ApiError } from '@/services/auth/authService';
import type { RegisterUserPayload } from '@/services/auth/authService';
import { useConsentProgress } from '@/hooks/useConsentProgress';
import { type AuthView } from './constants';
import './auth.scss';

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

  const location = useLocation();
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
  const [registrationPayload, setRegistrationPayload] = useState<Pick<RegisterUserPayload, 'email' | 'codeCompany' | 'password'> | null>(null);
  const [consentFullName, setConsentFullName] = useState('');
  const [consentDni, setConsentDni] = useState('');
  const [consentBirthDate, setConsentBirthDate] = useState<Date | null>(null);
  const dialogBodyRef = useRef<HTMLDivElement | null>(null);
  const documentCompletionRef = useRef({
    terms: false,
    privacy: false,
  });
  const formId = 'auth-dialog-form';
  const ICON_SIZE = 18;
  const trimmedUserId = useMemo(() => (userId ?? '').trim(), [userId]);
  const lastAutoConfirmKeyRef = useRef<string | null>(null);

  const confirmEmailRouteData = useMemo(() => {
    const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';

    if (normalizedPath !== '/confirm-token-email') {
      return null;
    }

    const params = new URLSearchParams(location.search);
    const rawEmail = params.get('email');
    const rawCode = params.get('token') ?? params.get('code');

    if (!rawEmail || !rawCode) {
      return null;
    }

    const trimmedEmail = rawEmail.trim();
    const normalizedEmail = trimmedEmail.replace(/\s/g, '+');
    const normalizedCode = rawCode.trim();

    if (!normalizedEmail || !normalizedCode) {
      return null;
    }

    return {
      key: `${normalizedEmail}|${normalizedCode}`,
      email: normalizedEmail,
      code: normalizedCode,
    };
  }, [location.pathname, location.search]);

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
    documentCompletionRef.current = {
      terms: false,
      privacy: false,
    };
    clearSignupErrors();
    setRegistrationPayload(null);
    setConsentFullName('');
    setConsentDni('');
    setConsentBirthDate(null);
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

    const invalidCodeMatchers = [
      /invalid\s+email.*code/, // english and generic permutations
      /correo\s+electrónico.*código.*inválid/i, // spanish
      /correu\s+electrònic.*codi.*invàlid/i, // catalan
    ];

    if (invalidCodeMatchers.some((matcher) => matcher.test(normalized))) {
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
      setView('confirmEmailSuccess');
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

  const { mutate: mutateConfirmEmail, reset: resetConfirmEmailMutation } = confirmEmailMutation;

  const {
    handleDialogBodyScroll,
    resetScrollProgress,
    currentScrollableKey,
    currentProgressValue,
    termsDocumentCompleted,
    privacyDocumentCompleted,
    consentTextCompleted,
    readingCompleted,
  } = useConsentProgress({ view, dialogBodyRef });

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

  const handleShowPrivacy = useCallback(() => {
    clearSignupErrors();
    setView('privacyPolicy');
  }, [clearSignupErrors]);

  const handleContinueToInformedConsent = useCallback(() => {
    setSignupSubmitting(false);
    setView('informedConsent');
  }, []);

  const handleBackFromTerms = useCallback(() => {
    setView('signup');
  }, []);

  const handleUserRegistered = useCallback((id: string) => {
    setUserId(id);
    setRegistrationPayload(null);
  }, []);

  const handleBackFromInformedConsent = useCallback(() => {
    setView('signup');
    setSignupSubmitting(false);
  }, []);

  const handleConsentConfirmed = useCallback(() => {
    setView('confirmEmail');
    clearConfirmEmailError();
    resetConfirmEmailMutation();
  }, [clearConfirmEmailError, resetConfirmEmailMutation]);

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
    mutateConfirmEmail(payload);
  }, [clearConfirmEmailError, mutateConfirmEmail, signupEmail, trimmedUserId]);

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

  const handleRegistrationDataReady = useCallback((payload: Pick<RegisterUserPayload, 'email' | 'codeCompany' | 'password'>) => {
    setRegistrationPayload(payload);
    setUserId(null);
  }, []);

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

  useEffect(() => {
    if (!confirmEmailRouteData) {
      lastAutoConfirmKeyRef.current = null;
      return;
    }

    const { email, code, key } = confirmEmailRouteData;

    const isSamePayload = lastAutoConfirmKeyRef.current === key;

    if (!isSamePayload) {
      setSignupEmail(email);
      setUserId(code);
      lastAutoConfirmKeyRef.current = key;
    }

    setView('confirmEmail');
    clearConfirmEmailError();
    resetConfirmEmailMutation();
    setDialogOpen(true);

    if (!isSamePayload) {
      mutateConfirmEmail({ email, code });
    }
  }, [clearConfirmEmailError, confirmEmailRouteData, mutateConfirmEmail, resetConfirmEmailMutation, setDialogOpen, setSignupEmail, setUserId, setView]);

  useEffect(() => {
    if (!isOpen) {
      resetScrollProgress();
      documentCompletionRef.current = {
        terms: false,
        privacy: false,
      };
      return;
    }

    if (view === 'signup' && termsDocumentCompleted && !documentCompletionRef.current.terms) {
      documentCompletionRef.current.terms = true;
      setSignupTermsAccepted(true);
    }

    if (view === 'signup' && privacyDocumentCompleted && !documentCompletionRef.current.privacy) {
      documentCompletionRef.current.privacy = true;
      setSignupPrivacyAccepted(true);
    }
  }, [isOpen, view, termsDocumentCompleted, privacyDocumentCompleted, resetScrollProgress]);

  const dialogActions = useMemo<ReactNode>(() => {
    const backIcon = <ArrowLeftIcon size={ICON_SIZE} />;
    const isTermsRead = termsDocumentCompleted;
    const isPrivacyRead = privacyDocumentCompleted;
    const isConsentTextRead = consentTextCompleted;

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
            disabled={!isTermsRead}
            animateOnEnable
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
            disabled={!isPrivacyRead}
            animateOnEnable
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
            registrationPayload={registrationPayload}
            onUserRegistered={handleUserRegistered}
            readingCompleted={readingCompleted}
            animateBackButton
            fullName={consentFullName}
            dni={consentDni}
            birthDate={consentBirthDate}
            onFullNameChange={(value) => setConsentFullName(value)}
            onDniChange={(value) => setConsentDni(value)}
            onBirthDateChange={(value) => setConsentBirthDate(value)}
          />
        );

      case 'confirmEmail':
        return null;

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
            disabled={!isConsentTextRead}
            animateOnEnable
          />,
          { contentAlign: 'start', buttonsAlign: 'start' }
        );

      case 'signupSuccess':
      case 'confirmEmailSuccess':
        return renderActionsWrapper(
          <Button
            variant="solid"
            size="md"
            text={view === 'confirmEmailSuccess' ? t('confirmEmail.success.cta') : t('signupSuccess.cta')}
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
    forgotSubmitting,
    formId,
    handleBackFromConsentText,
    handleBackFromInformedConsent,
    handleBackFromPrivacy,
    handleBackFromTerms,
    handleBackToLogin,
    handleConsentConfirmed,
    handleRegisterClick,
    handleShowConsentText,
    loginSubmitting,
    renderActionsWrapper,
    privacyDocumentCompleted,
    consentBirthDate,
    consentDni,
    consentFullName,
    consentTextCompleted,
    readingCompleted,
    signupPrivacyAccepted,
    signupSubmitting,
    signupTermsAccepted,
    termsDocumentCompleted,
    t,
    userId,
    view,
    registrationPayload,
    handleUserRegistered,
  ]);

  const dialogTitle = useMemo(() => {
    switch (view) {
      case 'termsOfUse':
        return termsOfUseTranslation.title;
      case 'privacyPolicy':
        return privacyPolicyTranslation.title;
      case 'informedConsent':
        return t('informedConsent.title');
      case 'informedConsentText':
        return 'Preparados, listos… ¡Ya!';
      case 'forgotPassword':
        return t('forgotPasswordScreen.title');
      case 'signup':
        return t('signupScreen.title');
      case 'confirmEmail':
        return t('confirmEmail.title');
      case 'confirmEmailSuccess':
        return '';
      case 'signupSuccess':
        return '';
      default:
        return t('title');
    }
  }, [
    privacyPolicyTranslation.title,
    t,
    termsOfUseTranslation.title,
    view,
  ]);

  const dialogSubtitle = useMemo(() => {
    switch (view) {
      case 'termsOfUse':
        return termsOfUseTranslation.subtitle;
      case 'privacyPolicy':
        return '';
      case 'informedConsent':
        return t('informedConsent.subtitle');
      case 'informedConsentText':
        return 'Ir a la intervención';
      case 'forgotPassword':
        return t('forgotPasswordScreen.subtitle');
      case 'signup':
        return t('signupScreen.subtitle');
      case 'confirmEmail':
        return t('confirmEmail.subtitle');
      case 'confirmEmailSuccess':
        return '';
      case 'signupSuccess':
        return '';
      default:
        return t('subtitle');
    }
  }, [
    t,
    termsOfUseTranslation.subtitle,
    view,
  ]);

  const afterBody = currentScrollableKey
    ? <ProgressLinear value={currentProgressValue} variant="soft" />
    : undefined;

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onOpenChange={setDialogOpen}
        title={dialogTitle}
        subtitle={dialogSubtitle}
        actions={dialogActions}
        afterBody={afterBody}
        bodyRef={dialogBodyRef}
        onBodyScroll={handleDialogBodyScroll}
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
            onRegistrationDataReady={handleRegistrationDataReady}
          />
        ) : view === 'termsOfUse' ? (
          <TermsOfUse sections={termsOfUseTranslation.sections} />
        ) : view === 'privacyPolicy' ? (
          <PrivacyPolicy />
        ) : view === 'informedConsent' ? (
          null
        ) : view === 'confirmEmail' ? (
          <ConfirmEmail
            email={signupEmail}
            token={userId ?? ''}
            onEmailChange={handleSignupEmailChange}
            onTokenChange={handleConfirmEmailUserIdChange}
            onConfirm={handleConfirmEmailSubmit}
            errorTranslationKey={confirmEmailErrorKey}
            errorMessage={confirmEmailErrorMessage}
            isSubmitting={confirmEmailMutation.isPending}
          />
        ) : view === 'informedConsentText' ? (
          <InformedConsentText />
        ) : view === 'confirmEmailSuccess' ? (
          <ConfirmEmailSuccess />
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
