import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CloseIcon } from '@/components/icons/Icons';
import type { ReactNode } from 'react';
import './dialog.scss';

export interface DialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function Dialog({
  isOpen,
  onOpenChange,
  title,
  subtitle,
  children,
  actions,
}: DialogProps) {
  const hasHeaderContent = Boolean(title || subtitle);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay" />
        <DialogPrimitive.Content className="dialog-content">
          <DialogPrimitive.Close className="dialog-close" aria-label="Close dialog">
            <CloseIcon aria-hidden="true" />
          </DialogPrimitive.Close>

          {hasHeaderContent ? (
            <header className="dialog-header">
              <div className="dialog-header-text">
                <DialogPrimitive.Title className="dialog-title">
                  {title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="dialog-subtitle">
                  {subtitle}
                </DialogPrimitive.Description>
              </div>
            </header>
          ) : null}

          <div className="dialog-body">{children}</div>
          {actions ? (
            <footer className="dialog-actions">
              {actions}
            </footer>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
