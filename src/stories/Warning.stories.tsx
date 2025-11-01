import type { Meta, StoryObj } from '@storybook/react';
import Warning from '@/components/warning/Warning';

const meta = {
  title: 'Components/Warning',
  component: Warning,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Alert component used to highlight warning, success, or important messages.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    message: 'An error occurred while saving your changes.',
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['error', 'success', 'important'],
    },
  },
} satisfies Meta<typeof Warning>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Error: Story = {};

export const Success: Story = {
  args: {
    variant: 'success',
    message: 'Response submitted successfully. Thank you!',
  },
};

export const Important: Story = {
  args: {
    variant: 'important',
    title: 'Action required',
    message: 'Complete the onboarding to keep using the platform.',
  },
};
