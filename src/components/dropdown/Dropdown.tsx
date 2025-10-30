import type { CSSProperties, ReactNode } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import './dropdown.scss';

export interface DropdownItem {
  readonly id: string;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly icon?: ReactNode;
  readonly content?: ReactNode;
  readonly className?: string;
  readonly disabled?: boolean;
  readonly onSelect?: () => void;
}

type DropdownVariant = 'default' | 'filter';

export interface DropdownProps {
  trigger: ReactNode;
  items: ReadonlyArray<DropdownItem>;
  modal?: boolean;
  align?: DropdownMenu.DropdownMenuContentProps['align'];
  sideOffset?: number;
  contentClassName?: string;
  useDefaultContentStyles?: boolean;
  arrow?: boolean;
  arrowClassName?: string;
  contentStyle?: CSSProperties;
  onOpenChange?: (open: boolean) => void;
  variant?: DropdownVariant;
}

function joinClassNames(...classes: Array<string | false | null | undefined>) {
  let result = '';

  for (const value of classes) {
    if (!value) {
      continue;
    }

    result = result ? `${result} ${value}` : value;
  }

  return result;
}

function renderItemContent({ content, icon, label, description }: DropdownItem) {
  if (content) {
    return content;
  }

  const shouldRenderBody = Boolean(label || description);

  if (!icon && !shouldRenderBody) {
    return null;
  }

  return (
    <div className="dropdown-item-layout">
      {icon && <span className="dropdown-item-icon">{icon}</span>}
      {shouldRenderBody && (
        <div className="dropdown-item-body">
          {label && <span className="dropdown-item-label">{label}</span>}
          {description && (
            <span className="dropdown-item-description">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function Dropdown({
  trigger,
  items,
  modal = false,
  align = 'center',
  sideOffset = 6,
  contentClassName,
  useDefaultContentStyles = true,
  arrow = false,
  arrowClassName,
  contentStyle,
  onOpenChange,
  variant = 'default',
}: DropdownProps) {
  const dropdownZIndex = 9999;
  const contentVariantClass = variant !== 'default' ? `dropdown-content--${variant}` : undefined;
  const itemVariantClass = variant !== 'default' ? `dropdown-item--${variant}` : undefined;

  return (
    <DropdownMenu.Root modal={modal} onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={sideOffset}
          className={joinClassNames(
            useDefaultContentStyles && 'dropdown-content',
            useDefaultContentStyles && contentVariantClass,
            contentClassName,
          )}
          style={{ zIndex: dropdownZIndex, ...contentStyle }}
        >
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.id}
              disabled={item.disabled}
              onSelect={() => {
                item.onSelect?.();
              }}
              className={joinClassNames('dropdown-item', itemVariantClass, item.className)}
            >
              {renderItemContent(item)}
            </DropdownMenu.Item>
          ))}

          {arrow && <DropdownMenu.Arrow className={joinClassNames('dropdown-arrow', arrowClassName)} />}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export type { DropdownItem as DropdownMenuItem };
