import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector, { type Language } from './language-selector/LanguageSelector';
import MobileMenu, { type MobileMenuLink } from './mobile-menu/MobileMenu';
import logoImage from '@/assets/img/logo.svg';
import Button from '@/components/button/Button';
import Link from '../../link/Link';
import { useAuthDialog } from '@/context/auth/useAuthDialog';
import { useAuthStore } from '@/stores/authStore';
import './top-navbar.scss';
import UserMenu from './user-menu/UserMenu';

export interface TopNavbarProps {
  className?: string;
  scrollThreshold?: number;
}

const MOBILE_MENU_ID = 'top-navbar-mobile-menu';
const MOBILE_MENU_BREAKPOINT = 660;

export default function TopNavbar({
  className,
  scrollThreshold = 10,
}: TopNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation(['navbar', 'auth']);
  const startSessionLabel = t('auth:start-session');
  const { openDialog } = useAuthDialog();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.innerWidth <= MOBILE_MENU_BREAKPOINT;
  });
  const navLinks: ReadonlyArray<MobileMenuLink> = [
    { to: '', labelKey: 'about' },
    { to: '', labelKey: 'contact' },
    { to: '', labelKey: 'other' },
  ];

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    if (!isMobileViewport) {
      return;
    }

    setIsMobileMenuOpen((previousState) => !previousState);
  }, [isMobileViewport]);

  const handleMobileLanguageChange = useCallback((language: Language) => {
    void language;
    closeMobileMenu();
  }, [closeMobileMenu]);

  const handleLoginClick = useCallback(() => {
    openDialog();
    if (isMobileMenuOpen) {
      closeMobileMenu();
    }
  }, [openDialog, isMobileMenuOpen, closeMobileMenu]);

  const mobileLanguageSelector = (
    <LanguageSelector
      onLanguageChange={handleMobileLanguageChange}
      displayMode="inline"
    />
  );

  const desktopLanguageSelector = (
    <LanguageSelector
      onLanguageChange={handleMobileLanguageChange}
      displayMode="dropdown"
    />
  );

  const authActions = !isAuthenticated ? (
    <Button 
      variant="solid" 
      size="md" 
      text={startSessionLabel}
      onClick={handleLoginClick}
    />
  ) : (
    <UserMenu />
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const scrollElement = document.querySelector<HTMLElement>('.page-container');
    const target: Window | HTMLElement = scrollElement ?? window;

    const handleScroll = () => {
      const scrollPosition = scrollElement ? scrollElement.scrollTop : window.scrollY;
      setIsScrolled(scrollPosition > scrollThreshold);
    };

    target.addEventListener('scroll', handleScroll, { passive: true });

    const rafId = window.requestAnimationFrame(handleScroll);

    return () => {
      target.removeEventListener('scroll', handleScroll);
      window.cancelAnimationFrame(rafId);
    };
  }, [scrollThreshold, location.pathname]);

  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname, closeMobileMenu]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleResize = () => {
      const isMobile = window.innerWidth <= MOBILE_MENU_BREAKPOINT;
      setIsMobileViewport(isMobile);

      if (!isMobile) {
        setIsMobileMenuOpen(false);
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!isMobileViewport) {
      return;
    }

    setIsMobileMenuOpen(false);
  }, [isMobileViewport]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    if (!isMobileMenuOpen || !isMobileViewport) {
      return undefined;
    }

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen, isMobileViewport]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isMobileMenuOpen || !isMobileViewport) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMobileMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen, isMobileViewport, closeMobileMenu]);

  const baseClassName = `top-navbar${isScrolled ? ' is-scrolled' : ''}${isAuthenticated ? ' is-authenticated' : ''}`;
  const componentClassName = className ? `${baseClassName} ${className}` : baseClassName;

  return (
    <nav className={componentClassName} aria-label="Top navigation">
      <div className="top-navbar-container">
        <div className="top-navbar-section top-navbar-logo">
          <RouterLink 
            className="top-navbar-logo-link"
            to="/">
            <img
              src={logoImage}
              alt="Beat App Logo"
              className="top-navbar-logo-image"
              loading="eager"
              width="auto"
              height="auto"
            />
          </RouterLink>
        </div>

        <div className="top-navbar-section top-navbar-center">
          {navLinks.map(({ to, labelKey }) => (
            <Link
              key={`${labelKey}-${to || 'root'}`}
              to={to}
              labelKey={labelKey}
            />
          ))}
        </div>

        <div className="top-navbar-section top-navbar-right">
          <MobileMenu
            id={MOBILE_MENU_ID}
            links={navLinks}
            isOpen={isMobileMenuOpen}
            isMobileViewport={isMobileViewport}
            onToggle={toggleMobileMenu}
            onClose={closeMobileMenu}
            languageSelector={isMobileViewport ? mobileLanguageSelector : undefined}
            authActions={isAuthenticated ? null : authActions}
          />
          <div className="top-navbar-right-desktop">
            {!isMobileViewport && desktopLanguageSelector}
            {authActions}
          </div>
        </div>
      </div>
    </nav>
  );
}


