import type { Meta, StoryObj } from '@storybook/react';
import Link from '@/components/link/Link';
import { withStorybookProviders } from '@/stories/decorators/withStorybookProviders';

const meta = {
  title: 'Components/Link',
  component: Link,
  decorators: [withStorybookProviders],
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
