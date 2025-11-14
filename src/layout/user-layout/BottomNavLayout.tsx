import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import PageLayout from '@/layout/page-layout/PageLayout';
import BottomNavbar from '@/components/navbar/bottom-navbar/BottomNavbar';
import type { BottomNavbarItem } from '@/components/navbar/bottom-navbar/types';
import { DEFAULT_BOTTOM_NAVBAR_ITEMS } from '@/components/navbar/bottom-navbar/defaultItems';
import { useAuthStore } from '@/stores/authStore';

export interface BottomNavLayoutProps {
  readonly items?: BottomNavbarItem[];
  readonly pageClassName?: string;
}

export default function BottomNavLayout({ items, pageClassName }: BottomNavLayoutProps) {
  const user = useAuthStore((state) => state.user);
  const hasRequiredQuestionnaireRounds = Boolean(user?.hasRequiredQuestionnaireRounds);
  const navigate = useNavigate();
  const location = useLocation();

  const baseItems = useMemo<BottomNavbarItem[]>(
    () => (items?.length ? items : DEFAULT_BOTTOM_NAVBAR_ITEMS),
    [items],
  );

  const questionnaireRoute = useMemo(
    () => {
      const questionnaireItem = baseItems.find((item) => item.route === '/questionnaires');
      return questionnaireItem?.route ?? '/questionnaires';
    },
    [baseItems],
  );

  const practiceRoute = useMemo(
    () => {
      const practiceItem = baseItems.find((item) => item.route === '/pratice');
      return practiceItem?.route ?? '/pratice';
    },
    [baseItems],
  );

  const resolvedItems = useMemo<BottomNavbarItem[]>(
    () => {
      if (!hasRequiredQuestionnaireRounds) {
        return baseItems;
      }

      const restrictedRoutes = [questionnaireRoute, practiceRoute]
        .filter((route): route is string => Boolean(route));

      return baseItems.filter((item) => restrictedRoutes.includes(item.route));
    },
    [baseItems, hasRequiredQuestionnaireRounds, practiceRoute, questionnaireRoute],
  );

  useEffect(() => {
    if (!hasRequiredQuestionnaireRounds) {
      return;
    }

    const normalizeRoute = (route: string) => {
      if (route === '/') {
        return route;
      }

      return route.endsWith('/') ? route.slice(0, -1) : route;
    };

    const allowedRoutes = [questionnaireRoute, practiceRoute]
      .filter((route): route is string => Boolean(route))
      .map(normalizeRoute);

    const currentPath = normalizeRoute(location.pathname);

    const isOnAllowedRoute = allowedRoutes.some((route) => (
      currentPath === route
      || currentPath.startsWith(`${route}/`)
    ));

    if (!isOnAllowedRoute && allowedRoutes.length > 0) {
      navigate(allowedRoutes[0], { replace: true });
    }
  }, [hasRequiredQuestionnaireRounds, questionnaireRoute, practiceRoute, location.pathname, navigate]);

  return (
    <>
      <PageLayout className={pageClassName}>
        <Outlet />
      </PageLayout>
      <BottomNavbar items={resolvedItems} />
    </>
  );
}
