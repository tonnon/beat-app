import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthDialogProvider } from '@/context/auth/AuthDialogContext';

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
        <AuthDialogProvider>{children}</AuthDialogProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
