import { useCallback, useMemo, useState } from 'react';
import type { ChangeEvent, ClipboardEvent, FormEvent, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import Checkbox from '@/components/checkbox/Checkbox';
import Textfield from '@/components/textfield/Textfield';
import Button from '@/components/button/Button';
import { ArrowLeftIcon } from '@/components/icons/Icons';
import Link from '@/components/link/Link';
import Warning from '@/components/warning/Warning';
import Tooltip from '@/components/tooltip/Tooltip';
import { ApiError, registerUser, type RegisterUserPayload, type RegisterUserResponse } from '@/services/auth/authService';
import { useApiErrorTranslation } from '@/hooks/useApiErrorTranslation';
import './informed-consent.scss';

type InformedConsentFooterProps = {
  readonly formId: string;
  readonly userId: string | null;
  readonly onSubmit?: React.FormEventHandler<HTMLFormElement>;
  readonly onSuccess?: () => void;
  readonly onShowConsentText?: () => void;
  readonly onBack?: () => void;
  readonly registrationPayload?: Pick<RegisterUserPayload, 'email' | 'codeCompany' | 'password'> | null;
  readonly onUserRegistered?: (userId: string) => void;
  readonly readingCompleted?: boolean;
  readonly animateBackButton?: boolean;
  readonly fullName: string;
  readonly dni: string;
  readonly birthDate: Date | null;
  readonly onFullNameChange: (value: string) => void;
  readonly onDniChange: (value: string) => void;
  readonly onBirthDateChange: (value: Date | null) => void;
};

export function InformedConsentFooter({
  formId,
  userId,
  onSubmit,
  onSuccess,
  onShowConsentText,
  onBack,
  registrationPayload,
  onUserRegistered,
  readingCompleted = false,
  animateBackButton = false,
  fullName,
  dni,
  birthDate,
  onFullNameChange,
  onDniChange,
  onBirthDateChange,
}: InformedConsentFooterProps) {
  const { t } = useTranslation<'auth'>('auth');
  const { translateApiError } = useApiErrorTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const ICON_SIZE = 18;
  const backIcon = <ArrowLeftIcon width={ICON_SIZE} height={ICON_SIZE} />;

  const {
    mutateAsync: registerUserAsync,
    isPending: isRegisterPending,
  } = useMutation<RegisterUserResponse, Error, RegisterUserPayload>({
    mutationFn: registerUser,
  });

  const handleNameBeforeInput = useCallback((event: FormEvent<HTMLInputElement>) => {
    const nativeEvent = event.nativeEvent as InputEvent;
    const data = nativeEvent.data;

    if (!data) {
      return;
    }

    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ''\-\s]+$/.test(data)) {
      nativeEvent.preventDefault();
    }
  }, []);

  const handleNamePaste = useCallback((event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData?.getData('text') ?? '';

    if (pasted && !/^[A-Za-zÀ-ÖØ-öø-ÿ''\-\s]+$/.test(pasted)) {
      event.preventDefault();
    }
  }, []);


  const handleFullNameInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    onFullNameChange(event.target.value);
  }, [onFullNameChange]);

  const handleDniInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    onDniChange(event.target.value);
  }, [onDniChange]);

  const handleBirthDateChange = useCallback((value: Date | null) => {
    onBirthDateChange(value);
  }, [onBirthDateChange]);

  const handleSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>((event) => {
    event.preventDefault();
    if (isSubmitting || isRegisterPending) {
      return;
    }

    const trimmedFullName = fullName.trim();
    const trimmedDni = dni.trim();

    if (!trimmedFullName || !trimmedDni) {
      return;
    }

    const normalizedBirthDate = birthDate
      ? `${birthDate.getFullYear()}-${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(birthDate.getDate()).padStart(2, '0')}`
      : undefined;

    setError(null);
    setIsSubmitting(true);

    void (async () => {
      try {
        let ensuredUserId = userId;

        if (!ensuredUserId) {
          if (!registrationPayload) {
            throw new Error(t('signupScreen.errors.registrationFailed'));
          }

          const registerPayload: RegisterUserPayload = {
            ...registrationPayload,
            fullName: trimmedFullName,
            dni: trimmedDni,
            birthDate: normalizedBirthDate ?? null,
          };

          const result = await registerUserAsync(registerPayload);
          ensuredUserId = result.userId;
          onUserRegistered?.(result.userId);
        }

        if (!ensuredUserId) {
          throw new Error(t('signupScreen.errors.registrationFailed'));
        }

        onSubmit?.(event);
        onSuccess?.();
      } catch (err) {
        if (err instanceof ApiError) {
          setError(translateApiError(err.originalMessage));
        } else if (err instanceof Error) {
          setError(err.message || t('informedConsent.errors.confirmationFailed'));
        } else {
          setError(t('informedConsent.errors.confirmationFailed'));
        }
      } finally {
        setIsSubmitting(false);
      }
    })();
  }, [
    birthDate,
    dni,
    fullName,
    isRegisterPending,
    isSubmitting,
    onSubmit,
    onSuccess,
    registerUserAsync,
    registrationPayload,
    t,
    translateApiError,
    userId,
    onUserRegistered,
  ]);


  const handleConsentLinkClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onShowConsentText?.();
  }, [onShowConsentText]);

  const renderImportantLinkLabel = useCallback((labelText: string) => (
    <>
      {labelText}
      <span aria-hidden="true" className="app-textfield-required-indicator">*</span>
    </>
  ), []);

  const readingRequiredTooltipMessage = t('informedConsent.readingRequiredTooltip');

  const checkboxLabel = useMemo(() => {
    const acceptLabelText = t('informedConsent.acceptLabel');
    const linkText = 'el estudio';
    const parts = acceptLabelText.split(linkText);

    return (
      <>
        {parts[0]}
        {' '}
        <Link
          to="#"
          label={renderImportantLinkLabel(linkText)}
          variant="important"
          onClick={handleConsentLinkClick}
        />
        {' '}
        {parts[1]}
      </>
    );
  }, [handleConsentLinkClick, renderImportantLinkLabel, t]);

  return (
    <div className="dialog-actions-content dialog-actions-content--align-start">
      <form id={formId} className="informed-consent-footer" onSubmit={handleSubmit}>
        <Textfield
          id="informed-consent-name"
          label={t('informedConsent.nameField.label')}
          placeholder={t('informedConsent.nameField.placeholder')}
          wrapperClassName="informed-consent-name-field"
          pattern="[A-Za-zÀ-ÖØ-öø-ÿ''\-\s]+"
          onBeforeInput={handleNameBeforeInput}
          onPaste={handleNamePaste}
          required
          value={fullName}
          onChange={handleFullNameInputChange}
        />
        <Textfield
          id="informed-consent-dni"
          label={t('informedConsent.dniField.label')}
          placeholder={t('informedConsent.dniField.placeholder')}
          wrapperClassName="informed-consent-dni-field"
          maxLength={9}
          required
          value={dni}
          onChange={handleDniInputChange}
        />
        <Textfield
          variant="date-picker"
          id="informed-consent-birthdate"
          label={t('informedConsent.birthdateField.label')}
          placeholder={t('informedConsent.birthdateField.placeholder')}
          wrapperClassName="informed-consent-birthdate-field"
          name="birthdate"
          value={birthDate}
          onDateChange={handleBirthDateChange}
        />
        <Tooltip content={readingRequiredTooltipMessage} delayDuration={0}>
          <Checkbox
            wrapperClassName="informed-consent-checkbox"
            label={checkboxLabel}
            checked={readingCompleted}
            disabled
            required
          />
        </Tooltip>
        {error && <Warning message={error} variant="error" />}
      </form>
      <div className="dialog-actions-buttons dialog-actions-buttons--align-start">
        <Button
          variant="border"
          size="md"
          text={t('back')}
          className="dialog-actions-secondary"
          type="button"
          onClick={onBack}
          icon={backIcon}
          iconPosition="left"
          disabled={isSubmitting || !readingCompleted}
          animateOnEnable={animateBackButton}
        />
        <Button
          variant="solid"
          size="md"
          text={t('informedConsent.confirm')}
          className="dialog-actions-primary"
          type="submit"
          form={formId}
          loading={isSubmitting || isRegisterPending}
          disabled={isSubmitting || isRegisterPending || !readingCompleted}
        />
      </div>
    </div>
  );
}
