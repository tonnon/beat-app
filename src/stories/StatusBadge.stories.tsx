import type { Meta, StoryObj } from '@storybook/react';
import StatusBadge from '@/components/status-badge/StatusBadge';

const meta = {
  title: 'Components/StatusBadge',
  component: StatusBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Status badge used on questionnaire cards, supporting banner/inline variants and optional dot.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    status: 'in_progress',
    label: 'In progress',
  },
  argTypes: {
    status: {
      control: 'inline-radio',
      options: ['completed', 'in_progress', 'not_started', 'all'],
    },
    variant: {
      control: 'inline-radio',
      options: ['banner', 'inline'],
    },
    showDot: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Completed: Story = {
  args: {
    status: 'completed',
    label: 'Completed',
  },
};

export const InProgress: Story = {
  args: {
    status: 'in_progress',
    label: 'In progress',
  },
};

export const NotStarted: Story = {
  args: {
    status: 'not_started',
    label: 'Not started',
  },
};

export const AllStatusesInline: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <StatusBadge status="completed" label="Completed" variant="inline" />
      <StatusBadge status="in_progress" label="In progress" variant="inline" />
      <StatusBadge status="not_started" label="Not started" variant="inline" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Inline variant showcasing the color palette for each status.',
      },
    },
  },
};
