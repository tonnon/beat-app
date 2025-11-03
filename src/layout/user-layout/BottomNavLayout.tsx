import { Outlet } from 'react-router-dom';
import PageLayout from '@/layout/page-layout/PageLayout';
import BottomNavbar from '@/components/navbar/bottom-navbar/BottomNavbar';
import type { BottomNavbarItem } from '@/components/navbar/bottom-navbar/BottomNavbar';

export interface BottomNavLayoutProps {
  readonly items?: BottomNavbarItem[];
  readonly pageClassName?: string;
}

export default function BottomNavLayout({ items, pageClassName }: BottomNavLayoutProps) {
  return (
    <>
      <PageLayout className={pageClassName}>
        <Outlet />
      </PageLayout>
      <BottomNavbar items={items} />
    </>
  );
}
