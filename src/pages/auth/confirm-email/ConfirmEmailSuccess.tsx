import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon } from '@/components/icons/Icons';
import type esAuth from '@/locales/es/auth.json';

import '../singup-success/singup-success.scss';

export default function ConfirmEmailSuccess() {
  const { t } = useTranslation<'auth'>('auth');
  const confirmEmail = useMemo(() => t('confirmEmail', { returnObjects: true }) as (typeof esAuth)['confirmEmail'], [t]);
  const successContent = confirmEmail.success;

  return (
    <div className="signup-success">
      <div className="signup-success-icon-wrapper">
        <CheckIcon size={32} className="signup-success-icon" />
      </div>
      <h2 className="signup-success-title">{successContent.title}</h2>
      <p className="signup-success-body">{successContent.body}</p>
    </div>
  );
}
