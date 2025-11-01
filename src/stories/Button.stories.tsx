import type { Meta, StoryObj } from '@storybook/react';
import Button from '@/components/button/Button';
import { StarIcon } from '@/components/icons/Icons';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Primary design system button with icon support, loading state, and responsive sizes.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['solid', 'border'],
    },
    size: {
      control: 'inline-radio',
      options: ['md', 'lg'],
    },
    loading: {
      control: 'boolean',
    },
    iconPosition: {
      control: 'inline-radio',
      options: ['left', 'right'],
    },
  },
  tags: ['autodocs'],
  args: {
    text: 'Continue',
    variant: 'solid',
    size: 'md',
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const BorderVariant: Story = {
  args: {
    variant: 'border',
    text: 'View responses',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    text: 'Loading...'
  },
};

export const WithIcon: Story = {
  args: {
    icon: <StarIcon size={16} />,
    text: 'Favorites',
  },
};

export const RightIcon: Story = {
  args: {
    icon: <StarIcon size={16} />,
    iconPosition: 'right',
    text: 'More details',
  },
};
