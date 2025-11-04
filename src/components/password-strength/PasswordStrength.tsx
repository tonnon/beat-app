import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import './password-strength.scss';

export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong';

export interface PasswordStrengthProps {
  readonly strength: PasswordStrengthLevel | null;
  readonly password: string;
}

interface PasswordRequirementItem {
  readonly id: 'length' | 'uppercase' | 'lowercase' | 'number' | 'symbol';
  readonly met: boolean;
  readonly required: boolean;
  readonly label: string;
}

export function PasswordStrength({ strength, password }: PasswordStrengthProps) {
  const { t } = useTranslation<'auth'>('auth');
  const trimmedPassword = password.trim();

  const requirements = useMemo<PasswordRequirementItem[]>(() => {
    return [
      {
        id: 'length',
        met: trimmedPassword.length >= 8,
        required: true,
        label: t('signupScreen.password.requirements.items.length'),
      },
    ];
  }, [t, trimmedPassword]);

  if (!trimmedPassword) {
    return null;
  }

  const strengthKey: PasswordStrengthLevel = strength ?? 'weak';
  const strengthLabel = t(`signupScreen.password.strength.${strengthKey}`);
  const firstUnmetRequirement = requirements.find((requirement) => requirement.required && !requirement.met)
    ?? requirements.find((requirement) => !requirement.met);
  const detailMessage = firstUnmetRequirement?.label
    ?? t('signupScreen.password.requirements.items.length');
  const accessibleMessage = detailMessage ? `${strengthLabel}. ${detailMessage}` : strengthLabel;

  return (
    <div className="password-strength">
      <div
        className={`password-strength-meter password-strength-meter--${strengthKey}`}
        role="status"
        aria-live="polite"
        aria-label={accessibleMessage}
      >
        <div className="password-strength-meter-track" aria-hidden="true">
          <span className={`password-strength-meter-fill password-strength-meter-fill--${strengthKey}`} />
        </div>
        <ul className="password-strength-requirements-list" aria-live="polite">
          {requirements.map(({ id, met, label }) => (
            <li
              key={id}
              className={`password-strength-requirements-item${met ? ' password-strength-requirements-item--met' : ''}`}
            >
              <span className="password-strength-requirements-status" aria-hidden="true" />
              <span className="password-strength-requirements-label">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default PasswordStrength;
