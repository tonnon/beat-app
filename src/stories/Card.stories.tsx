import type { Meta, StoryObj } from '@storybook/react';
import Card from '@/components/card/Card';
import type { CardStatus } from '@/components/card/Card';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Questionnaire card with progress indicator, status, and primary/secondary actions.',
      },
    },
  },
  args: {
    responsesLabel: 'View responses',
    continueLabel: 'Continue',
  },
  argTypes: {
    status: {
      control: 'inline-radio',
      options: ['completed', 'in_progress', 'not_started'],
    },
    progress: {
      control: { type: 'range', min: 0, max: 100, step: 5 },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

type StoryFactoryArgs = {
  status: CardStatus;
  progress: number;
};

const buildArgs = ({ status, progress }: StoryFactoryArgs) => ({
  id: `${status}-${progress}`,
  title: 'Organizational diagnosis',
  status,
  statusLabel:
    status === 'completed'
      ? 'Completed'
      : status === 'in_progress'
        ? 'In progress'
        : 'Not started',
  progress,
});

export const Completed: Story = {
  args: buildArgs({ status: 'completed', progress: 100 }),
};

export const InProgress: Story = {
  args: buildArgs({ status: 'in_progress', progress: 55 }),
};

export const NotStarted: Story = {
  args: buildArgs({ status: 'not_started', progress: 0 }),
};
