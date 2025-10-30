
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from '../routes';
import TopNavbar from '@/components/navbar/top-navbar/TopNavbar';
import Auth from '@/pages/auth/Auth';
import { AuthDialogProvider } from '@/context/auth/AuthDialogContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthDialogProvider>
          <AppRoutes />
          <TopNavbar />
          <Auth />
        </AuthDialogProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
