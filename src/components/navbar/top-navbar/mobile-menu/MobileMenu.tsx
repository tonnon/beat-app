import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MobileMenu as MobileMenuIcon } from '@/components/icons/Icons';
import { useFadeIn } from '@/hooks/useRouteFadeIn';
import Link, { type TopNavbarTranslationKey } from '../../../link/Link';
import './mobile-menu.scss';

export interface MobileMenuLink {
  readonly to: string;
  readonly labelKey: TopNavbarTranslationKey;
}

export interface MobileMenuProps {
  readonly id: string;
  readonly links: ReadonlyArray<MobileMenuLink>;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onToggle: () => void;
  readonly isMobileViewport: boolean;
  readonly languageSelector?: ReactNode;
  readonly authActions?: ReactNode;
}

export default function MobileMenu({
  id,
  links,
  isOpen,
  onClose,
  onToggle,
  isMobileViewport,
  languageSelector,
  authActions,
}: MobileMenuProps) {
  const shouldDisplayMenu = isMobileViewport && isOpen;
  const menuClassName = `mobile-menu${shouldDisplayMenu ? ' is-open' : ''}`;
  const toggleAriaLabel = shouldDisplayMenu ? 'Close navigation menu' : 'Open navigation menu';
  const overlayRef = useFadeIn<HTMLDivElement>(shouldDisplayMenu, { duration: 0.24 });
  const contentRef = useRef<HTMLDivElement | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !shouldDisplayMenu) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const shouldIgnoreEvent = [contentRef.current, toggleButtonRef.current]
        .some((element) => element?.contains(target));

      if (shouldIgnoreEvent) {
        return;
      }

      onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [shouldDisplayMenu, onClose]);

  const menuOverlay = (
    <div
      id={id}
      className={menuClassName}
      ref={overlayRef}
      aria-hidden={!shouldDisplayMenu}
    >
      <div
        className="mobile-menu-content"
        ref={contentRef}
      >
        <div className="mobile-menu-links" role="list">
          {links.map(({ to, labelKey }) => (
            <Link
              key={`mobile-${labelKey}-${to || 'root'}`}
              to={to}
              labelKey={labelKey}
              role="listitem"
              onNavigate={onClose}
            />
          ))}
        </div>

        <span className="mobile-menu-divider" aria-hidden="true" />

        <div className="mobile-menu-actions">
          {languageSelector && (
            <div className="mobile-menu-language">
              {languageSelector}
            </div>
          )}

          {authActions}
        </div>
      </div>
    </div>
  );

  const renderedOverlay = typeof document !== 'undefined'
    ? createPortal(menuOverlay, document.body)
    : menuOverlay;

  return (
    <>
      <button
        type="button"
        className="top-navbar-mobile-toggle"
        aria-controls={id}
        aria-expanded={shouldDisplayMenu}
        aria-label={toggleAriaLabel}
        onClick={onToggle}
        disabled={!isMobileViewport}
        ref={toggleButtonRef}
      >
        <MobileMenuIcon size={24} />
      </button>
      {renderedOverlay}
    </>
  );
}
