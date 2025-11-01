import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import Link from '@/components/link/Link';
import i18n from '@/i18n/config';
import { I18nextProvider } from 'react-i18next';

const meta = {
  title: 'Components/Link',
  component: Link,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <Story />
        </I18nextProvider>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Top navbar styled link with translation support through i18next.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    to: '/dashboard',
    label: 'Dashboard',
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['default', 'subtle'],
    },
  },
} satisfies Meta<typeof Link>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TranslatedLabel: Story = {
  args: {
    labelKey: 'my_insignia',
    label: undefined,
  },
};

export const SubtleVariant: Story = {
  args: {
    variant: 'subtle',
    label: 'Settings',
  },
};
