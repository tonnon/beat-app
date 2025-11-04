import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type navbarEs from '@/locales/es/navbar.json';
import './link.scss';

export type TopNavbarTranslationKey = keyof typeof navbarEs;

type RouterLinkProps = ComponentPropsWithoutRef<typeof RouterLink>;

export interface LinkProps extends Omit<RouterLinkProps, 'children'> {
  readonly labelKey?: TopNavbarTranslationKey;
  readonly label?: ReactNode;
  readonly onNavigate?: () => void;
  readonly variant?: 'default' | 'subtle' | 'important';
}

const BASE_CLASSNAME = 'top-navbar-link';

export default function Link({
  labelKey,
  label,
  className,
  onNavigate,
  onClick,
  variant = 'default',
  ...linkProps
}: LinkProps) {
  const { t } = useTranslation('navbar');

  const variantClass = `${BASE_CLASSNAME}--${variant}`;
  const composedClassName = [BASE_CLASSNAME, variantClass, className]
    .filter(Boolean)
    .join(' ');

  const content = label ?? (labelKey ? t(labelKey) : '');

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (!event.defaultPrevented) {
      onNavigate?.();
    }
  };

  return (
    <RouterLink
      {...linkProps}
      className={composedClassName}
      onClick={handleClick}
    >
      {content}
    </RouterLink>
  );
}
