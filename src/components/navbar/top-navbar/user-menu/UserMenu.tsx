import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import type { IconType } from 'react-icons';
import Dropdown, { type DropdownItem } from '@/components/dropdown/Dropdown';
import {
  UserIcon,
  StarIcon,
  PenIcon,
  SettingsIcon,
  CommentIcon,
  LogoutIcon,
} from '@/components/icons/Icons';
import type navbarEs from '@/locales/es/navbar.json';
import './user-menu.scss';

type NavbarTranslationKey = keyof typeof navbarEs;

type MenuOptionDefinition = {
  readonly id: string;
  readonly labelKey: NavbarTranslationKey;
  readonly icon: IconType;
  readonly onSelect?: () => void;
};

const MENU_OPTIONS: ReadonlyArray<MenuOptionDefinition> = [
  {
    id: 'my-insignia',
    labelKey: 'my_insignia',
    icon: StarIcon,
  },
  {
    id: 'changes-communications',
    labelKey: 'changes_communications',
    icon: PenIcon,
  },
  {
    id: 'password-change',
    labelKey: 'password_change',
    icon: SettingsIcon,
  },
  {
    id: 'my-letter',
    labelKey: 'my_letter',
    icon: CommentIcon,
  },
  {
    id: 'logout',
    labelKey: 'logout',
    icon: LogoutIcon,
  },
];

export default function UserMenu() {
  const { t } = useTranslation('navbar');
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    logout();
    navigate('/', { replace: true });
  }, [logout, navigate]);

  const menuItems = useMemo(
    () =>
      MENU_OPTIONS.map<DropdownItem>(({ id, icon: IconComponent, labelKey, onSelect }) => ({
        id,
        className: 'user-menu-item',
        onSelect: id === 'logout' ? handleLogout : onSelect,
        content: (
          <div className="user-menu-item-content">
            <span className="user-menu-item-icon">
              <IconComponent size={18} />
            </span>
            <span className="user-menu-item-label">{t(labelKey)}</span>
          </div>
        ),
      })),
    [t, handleLogout],
  );

  return (
    <Dropdown
      trigger={
        <button className="user-menu-trigger" type="button" aria-label="Open user menu">
          <UserIcon size={22} />
        </button>
      }
      items={menuItems}
      align="end"
      sideOffset={6}
      contentClassName="user-menu-content"
      useDefaultContentStyles={false}
      arrow
    />
  );
}
