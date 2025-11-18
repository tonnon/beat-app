import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Root as VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { CloseIcon } from '@/components/icons/Icons';
import type { ReactNode, Ref, UIEvent } from 'react';
import './dialog.scss';

export interface DialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  accessibilityTitle?: string;
  accessibilityDescription?: string;
  hideHeader?: boolean;
  children: ReactNode;
  actions?: ReactNode;
  afterBody?: ReactNode;
  decorations?: ReactNode;
  bodyRef?: Ref<HTMLDivElement>;
  onBodyScroll?: (event: UIEvent<HTMLDivElement>) => void;
}

export default function Dialog({
  isOpen,
  onOpenChange,
  title,
  subtitle,
  accessibilityTitle,
  accessibilityDescription,
  hideHeader = false,
  children,
  actions,
  afterBody,
  decorations,
  bodyRef,
  onBodyScroll,
}: DialogProps) {
  const normalizedTitle = title?.trim() ?? '';
  const normalizedSubtitle = subtitle?.trim() ?? '';
  const hasHeaderContent = !hideHeader && Boolean(normalizedTitle || normalizedSubtitle);
  const hasVisibleSubtitle = Boolean(normalizedSubtitle);
  const accessibleTitle = normalizedTitle || accessibilityTitle?.trim() || null;
  const accessibleDescription = normalizedSubtitle || accessibilityDescription?.trim() || null;
  const fallbackAccessibleTitle = accessibleTitle ?? 'Dialog';
  const fallbackAccessibleDescription = accessibleDescription ?? ' ';

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay" />
        <div className="dialog-container">
          {decorations ? (
            <div className="dialog-decorations" aria-hidden="true">
              {decorations}
            </div>
          ) : null}

          <DialogPrimitive.Content className="dialog-content">
            <DialogPrimitive.Close className="dialog-close" aria-label="Close dialog">
              <CloseIcon aria-hidden="true" />
            </DialogPrimitive.Close>

            {hasHeaderContent ? (
              <header className="dialog-header">
                <div className="dialog-header-text">
                  <DialogPrimitive.Title className="dialog-title">
                    {normalizedTitle}
                  </DialogPrimitive.Title>
                  {hasVisibleSubtitle ? (
                    <DialogPrimitive.Description className="dialog-subtitle">
                      {normalizedSubtitle}
                    </DialogPrimitive.Description>
                  ) : (
                    <VisuallyHidden>
                      <DialogPrimitive.Description>{accessibleDescription ?? ' '}</DialogPrimitive.Description>
                    </VisuallyHidden>
                  )}
                </div>
              </header>
            ) : (
              <VisuallyHidden>
                <DialogPrimitive.Title>{fallbackAccessibleTitle}</DialogPrimitive.Title>
                <DialogPrimitive.Description>{fallbackAccessibleDescription}</DialogPrimitive.Description>
              </VisuallyHidden>
            )}

            <div className="dialog-body" ref={bodyRef} onScroll={onBodyScroll}>
              {children}
            </div>
            {afterBody ? (
              <div className="dialog-body-addon">
                {afterBody}
              </div>
            ) : null}
            {actions ? (
              <footer className="dialog-actions">
                {actions}
              </footer>
            ) : null}
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
