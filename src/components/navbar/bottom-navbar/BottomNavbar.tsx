import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { BottomNavbarItem } from './types';
import { DEFAULT_BOTTOM_NAVBAR_ITEMS } from './defaultItems';
import './bottom-navbar.scss';

export interface BottomNavbarProps<Item extends BottomNavbarItem = BottomNavbarItem> {
  items?: Item[];
  activeIndex?: number;
  defaultActiveIndex?: number;
  onChange?: (index: number, item: Item, event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

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
  const location = useLocation();

  const resolvedItems = useMemo(
    () => (items?.length ? items : (DEFAULT_BOTTOM_NAVBAR_ITEMS as Item[])),
    [items]
  );

  const computedItems = useMemo(
    () =>
      resolvedItems.map((item) => {
        const { route, onClick } = item;

        if (!route) {
          return item;
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
        } as Item;
      }),
    [resolvedItems, navigate]
  );

  const isControlled = activeIndex !== undefined;
  const [internalIndex, setInternalIndex] = useState(() =>
    clampIndex(defaultActiveIndex, computedItems.length)
  );

  const locationIndex = useMemo(() => {
    const pathname = location.pathname;
    const matchedIndex = computedItems.findIndex((item) => {
      if (!item.route) {
        return false;
      }

      if (pathname === item.route) {
        return true;
      }

      return pathname.startsWith(item.route.endsWith('/') ? item.route : `${item.route}/`);
    });

    return matchedIndex >= 0 ? matchedIndex : undefined;
  }, [computedItems, location.pathname]);

  useEffect(() => {
    if (!isControlled && locationIndex !== undefined && locationIndex !== internalIndex) {
      setInternalIndex(locationIndex);
    }
  }, [internalIndex, isControlled, locationIndex]);

  const currentIndex = clampIndex(
    isControlled
      ? activeIndex
      : locationIndex !== undefined
        ? locationIndex
        : internalIndex,
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