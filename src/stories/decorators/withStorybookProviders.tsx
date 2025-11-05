import type { Decorator } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { AuthDialogProvider } from '@/context/auth/AuthDialogProvider';
import i18n from '@/i18n/config';

interface StorybookProvidersOptions {
  readonly withRouter?: boolean;
}

const defaultOptions: Required<StorybookProvidersOptions> = {
  withRouter: true,
};

export const withStorybookProviders: Decorator = (Story, context) => {
  const { withRouter } = { ...defaultOptions, ...context.parameters?.storybookProviders } as StorybookProvidersOptions;
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
        refetchOnWindowFocus: false,
      },
    },
  });

  const content = (
    <QueryClientProvider client={queryClient}>
      {withRouter ? (
        <MemoryRouter>
          <AuthDialogProvider>
            <I18nextProvider i18n={i18n}>
              <Story />
            </I18nextProvider>
          </AuthDialogProvider>
        </MemoryRouter>
      ) : (
        <AuthDialogProvider>
          <I18nextProvider i18n={i18n}>
            <Story />
          </I18nextProvider>
        </AuthDialogProvider>
      )}
    </QueryClientProvider>
  );

  return content;
};
