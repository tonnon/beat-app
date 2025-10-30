import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon } from '@/components/icons/Icons';
import type esAuth from '@/locales/es/auth.json';

import './singup-success.scss';

export default function SingupSuccess() {
  const { t } = useTranslation<'auth'>('auth');
  const signupSuccess = useMemo(() => t('signupSuccess', { returnObjects: true }) as (typeof esAuth)['signupSuccess'], [t]);

  return (
    <div className="signup-success">
      <div className="signup-success-icon-wrapper">
        <CheckIcon size={32} className="signup-success-icon" />
      </div>
      <h2 className="signup-success-title">{signupSuccess.title}</h2>
      <p className="signup-success-body">{signupSuccess.body}</p>
    </div>
  );
}
