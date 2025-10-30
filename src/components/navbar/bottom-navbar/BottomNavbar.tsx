import { useCallback, useMemo, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import type { IconType } from 'react-icons';
import { useNavigate } from 'react-router-dom';
import {
  ChecklistIcon,
  EducationIcon,
  HeadCircuitIcon,
  GraphIcon,
  CommentIcon,
} from '@/components/icons/Icons';
import './bottom-navbar.scss';

export interface BottomNavbarProps<
  Item extends {
    icon: IconType;
    label?: string;
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
    route?: string;
  } = {
    icon: IconType;
    label?: string;
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
    route?: string;
  }
> {
  items?: Item[];
  activeIndex?: number;
  defaultActiveIndex?: number;
  onChange?: (index: number, item: Item, event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export type BottomNavbarItem = {
  icon: IconType;
  label?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  route?: string;
};

const NAVBAR_ITEMS: BottomNavbarItem[] = [
  { icon: ChecklistIcon, label: 'Checklist', route: '/questionnaires' },
  { icon: EducationIcon, label: 'Education' },
  { icon: HeadCircuitIcon, label: 'Head Circuit', route: '/pratice' },
  { icon: GraphIcon, label: 'Graphic' },
  { icon: CommentIcon, label: 'Comment' },
];

function clampIndex(index: number | undefined, length: number): number {
  if (!length) return 0;
  if (typeof index !== 'number' || Number.isNaN(index)) return 0;
  return Math.max(0, Math.min(index, length - 1));
}

export default function BottomNavbar<
  Item extends BottomNavbarItem = BottomNavbarItem
>({
  items,
  activeIndex,
  defaultActiveIndex = 0,
  onChange,
  className,
}: BottomNavbarProps<Item>) {
  const navigate = useNavigate();

  const defaultItems = useMemo(
    () =>
      NAVBAR_ITEMS.map((item) => {
        const { route, onClick } = item;

        if (!route) {
          return item as Item;
        }

        return {
          ...item,
          onClick: (event: MouseEvent<HTMLButtonElement>) => {
            onClick?.(event);

            if (event.defaultPrevented) {
              return;
            }

            event.preventDefault();
            navigate(route);
          },
        };
      }) as Item[],
    [navigate]
  );

  const computedItems = useMemo(
    () => (items?.length ? items : defaultItems),
    [items, defaultItems]
  );

  const isControlled = activeIndex !== undefined;
  const [internalIndex, setInternalIndex] = useState(() =>
    clampIndex(defaultActiveIndex, computedItems.length)
  );

  const currentIndex = clampIndex(
    isControlled ? activeIndex : internalIndex,
    computedItems.length
  );

  const handleItemClick = useCallback(
    (index: number, item: Item, event: MouseEvent<HTMLButtonElement>) => {
      if (!isControlled) {
        setInternalIndex(index);
      }

      onChange?.(index, item, event);
      item.onClick?.(event);
    },
    [isControlled, onChange]
  );

  if (!computedItems.length) {
    return null;
  }

  const activeItem = computedItems[currentIndex];
  const ActiveIcon = activeItem?.icon;

  const itemCount = computedItems.length;
  const indicatorLeft = `calc((100% / ${itemCount * 2}) + (100% / ${itemCount}) * ${currentIndex} - 25px)`;

  const indicatorStyle: CSSProperties = {
    left: indicatorLeft,
  };

  const componentClassName = ['bottom-navbar', className]
    .filter(Boolean)
    .join(' ');

  return (
    <nav className={componentClassName} aria-label="Main navigation">
      <ul className="bottom-navbar-list" role="tablist">
        {computedItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = index === currentIndex;
          const itemId = `bottom-navbar-item-${index}`;

          return (
            <li
              key={itemId}
              className={['bottom-navbar-item', isActive && 'is-active']
                .filter(Boolean)
                .join(' ')}
              role="presentation"
            >
              <button
                type="button"
                className="bottom-navbar-button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${index}`}
                aria-label={item.label || `Navigation item ${index + 1}`}
                tabIndex={isActive ? 0 : -1}
                onClick={(event) => handleItemClick(index, item, event)}
              >
                <span className="bottom-navbar-icon" aria-hidden="true">
                  <Icon />
                </span>
              </button>
            </li>
          );
        })}
        <div className="bottom-navbar-indicator" style={indicatorStyle} aria-hidden="true">
          {ActiveIcon && (
            <span className="bottom-navbar-indicator-icon">
              <ActiveIcon />
            </span>
          )}
        </div>
      </ul>
    </nav>
  );
}