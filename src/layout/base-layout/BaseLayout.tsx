import type { ReactNode } from 'react';
import useRouteFadeIn from '@/hooks/useRouteFadeIn';
import './base-layout.scss';

export interface BaseLayoutProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export default function BaseLayout({ children }: BaseLayoutProps) {
  const contentRef = useRouteFadeIn<HTMLDivElement>();

  return (
    <main className="base-layout">
      <div ref={contentRef} className="base-layout-content">
        {children}
      </div>
    </main>
  );
}
