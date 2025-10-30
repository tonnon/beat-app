import type { ReactNode } from 'react';
import useRouteFadeIn from '@/hooks/useRouteFadeIn';
import './page-layout.scss';

export interface PageLayoutProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export default function PageLayout({ children, className }: PageLayoutProps) {
  const contentRef = useRouteFadeIn<HTMLDivElement>();

  return (
    <main className={className ? `page-container ${className}` : 'page-container'}>
      <div ref={contentRef} className="page-container-content">
        {children}
      </div>
    </main>
  );
}
