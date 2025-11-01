
import AppRoutes from '../routes';
import TopNavbar from '@/components/navbar/top-navbar/TopNavbar';
import Auth from '@/pages/auth/Auth';
import RootProviders from '@/providers/RootProviders';

export default function App() {
  return (
    <RootProviders>
      <AppRoutes />
      <TopNavbar />
      <Auth />
    </RootProviders>
  );
}
