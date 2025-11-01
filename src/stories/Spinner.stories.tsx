import type { Meta, StoryObj } from '@storybook/react';
import Spinner from '@/components/spinner/Spinner';

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Loading indicator available in "sm" and "md" sizes with accessible ARIA attributes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['sm', 'md'],
    },
    role: {
      control: 'inline-radio',
      options: ['status', 'progressbar'],
    },
  },
  args: {
    size: 'md',
  },
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const ProgressbarRole: Story = {
  args: {
    role: 'progressbar',
    'aria-label': 'Loading server data',
  },
};
