import { useCallback, useMemo, useState } from 'react';
import type { ClipboardEvent, FormEvent, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import Checkbox from '@/components/checkbox/Checkbox';
import Textfield from '@/components/textfield/Textfield';
import Button from '@/components/button/Button';
import { ArrowLeftIcon } from '@/components/icons/Icons';
import Link from '@/components/link/Link';
import Warning from '@/components/warning/Warning';
import { confirmConsent, ApiError, type ConfirmConsentPayload, registerUser, type RegisterUserPayload, type RegisterUserResponse } from '@/services/auth/authService';
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
};

export function InformedConsentFooter({ formId, userId, onSubmit, onSuccess, onShowConsentText, onBack, registrationPayload, onUserRegistered }: InformedConsentFooterProps) {
  const { t } = useTranslation<'auth'>('auth');
  const { translateApiError } = useApiErrorTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  
  const ICON_SIZE = 18;
  const backIcon = <ArrowLeftIcon width={ICON_SIZE} height={ICON_SIZE} />;

  const registerMutation = useMutation<RegisterUserResponse, Error, RegisterUserPayload>({
    mutationFn: registerUser,
  });

  const consentMutation = useMutation({
    mutationFn: confirmConsent,
    onSuccess: () => {
      setIsSubmitting(false);
      onSuccess?.();
    },
    onError: (err: Error) => {
      setIsSubmitting(false);
      
      if (err instanceof ApiError) {
        const translatedError = translateApiError(err.originalMessage);
        setError(translatedError);
      } else {
        setError(err.message || t('informedConsent.errors.confirmationFailed'));
      }
    },
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


  const handleSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>((event) => {
    event.preventDefault();
    if (isSubmitting || registerMutation.isPending) {
      return;
    }

    const form = event.currentTarget;

    const fullName = (form.querySelector('#informed-consent-name') as HTMLInputElement)?.value?.trim();
    const dni = (form.querySelector('#informed-consent-dni') as HTMLInputElement)?.value?.trim();
    const birthDateRaw = (form.querySelector('#informed-consent-birthdate') as HTMLInputElement)?.value;

    if (!fullName || !dni) {
      return;
    }

    const birthDate = birthDateRaw
      ? birthDateRaw.includes('/')
        ? birthDateRaw.split('/').reverse().join('-')
        : birthDateRaw
      : undefined;

    setError(null);
    setIsSubmitting(true);

    void (async () => {
      let ensuredUserId = userId;

      if (!ensuredUserId) {
        if (!registrationPayload) {
          setIsSubmitting(false);
          setError(t('signupScreen.errors.registrationFailed'));
          return;
        }

        try {
          const registerPayload: RegisterUserPayload = {
            ...registrationPayload,
            fullName,
            dni,
            birthDate: birthDate ?? null,
          };

          const result = await registerMutation.mutateAsync(registerPayload);
          ensuredUserId = result.userId;
          onUserRegistered?.(result.userId);
        } catch (err) {
          setIsSubmitting(false);

          if (err instanceof ApiError) {
            setError(translateApiError(err.originalMessage));
          } else if (err instanceof Error) {
            setError(err.message || t('signupScreen.errors.registrationFailed'));
          } else {
            setError(t('signupScreen.errors.registrationFailed'));
          }
          return;
        }
      }

      if (!ensuredUserId) {
        setIsSubmitting(false);
        setError(t('signupScreen.errors.registrationFailed'));
        return;
      }

      const payload: ConfirmConsentPayload = {
        userId: ensuredUserId,
        fullName,
        dni,
        ...(birthDate ? { birthDate } : {}),
      };

      consentMutation.mutate(payload);
      onSubmit?.(event);
    })();
  }, [consentMutation, isSubmitting, onSubmit, registerMutation, registrationPayload, t, translateApiError, userId, onUserRegistered]);


  const handleConsentLinkClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onShowConsentText?.();
  }, [onShowConsentText]);

  const handleConsentChange = useCallback((checked: boolean) => {
    setConsentAccepted(checked);
  }, []);

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
          label={linkText}
          variant="subtle"
          onClick={handleConsentLinkClick}
        />
        {' '}
        {parts[1]}
      </>
    );
  }, [handleConsentLinkClick, t]);

  return (
    <div className="dialog-actions-content dialog-actions-content--align-start">
      <form id={formId} className="informed-consent-footer" onSubmit={handleSubmit}>
        <Checkbox
          wrapperClassName="informed-consent-checkbox"
          label={checkboxLabel}
          checked={consentAccepted}
          onCheckedChange={handleConsentChange}
          required
        />
        <Textfield
          id="informed-consent-name"
          label={t('informedConsent.nameField.label')}
          placeholder={t('informedConsent.nameField.placeholder')}
          wrapperClassName="informed-consent-name-field"
          pattern="[A-Za-zÀ-ÖØ-öø-ÿ''\-\s]+"
          onBeforeInput={handleNameBeforeInput}
          onPaste={handleNamePaste}
          required
        />
        <Textfield
          id="informed-consent-dni"
          label={t('informedConsent.dniField.label')}
          placeholder={t('informedConsent.dniField.placeholder')}
          wrapperClassName="informed-consent-dni-field"
          maxLength={9}
          required
        />
        <Textfield
          variant="date-picker"
          id="informed-consent-birthdate"
          label={t('informedConsent.birthdateField.label')}
          placeholder={t('informedConsent.birthdateField.placeholder')}
          wrapperClassName="informed-consent-birthdate-field"
          name="birthdate"
        />
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
          disabled={isSubmitting}
        />
        <Button
          variant="solid"
          size="md"
          text={t('informedConsent.confirm')}
          className="dialog-actions-primary"
          type="submit"
          form={formId}
          loading={isSubmitting || registerMutation.isPending}
          disabled={isSubmitting || registerMutation.isPending || !consentAccepted}
        />
      </div>
    </div>
  );
}
