import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RefreshToken from '@/app/RefreshToken';
import { AuthDialogProvider } from '@/context/auth/AuthDialogProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface RootProvidersProps {
  readonly children: ReactNode;
}

export default function RootProviders({ children }: RootProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RefreshToken />
        <AuthDialogProvider>{children}</AuthDialogProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
