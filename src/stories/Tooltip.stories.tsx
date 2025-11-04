import type { Meta, StoryObj } from '@storybook/react';
import Tooltip from '@/components/tooltip/Tooltip';
import Button from '@/components/button/Button';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Accessible tooltip built on Radix with configurable placement and show delay.',
      },
    },
  },
  argTypes: {
    delayDuration: {
      control: { type: 'number', min: 0, max: 2000, step: 100 },
    },
    side: {
      control: 'inline-radio',
      options: ['top', 'right', 'bottom', 'left'],
    },
    align: {
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
    },
  },
  args: {
    content: 'More information about this action.',
    delayDuration: 0,
    side: 'top',
    align: 'center',
    sideOffset: 6,
    children: <Button text="Hover me" variant="border" />,
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Delayed: Story = {
  args: {
    delayDuration: 600,
    children: <Button text="Delayed tooltip" />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Increases `delayDuration` to showcase the built-in appearance delay.',
      },
    },
  },
};

export const CustomPlacement: Story = {
  args: {
    side: 'right',
    align: 'start',
    sideOffset: 12,
    children: <Button text="Right aligned" />,
  },
};

export const RichContent: Story = {
  args: {
    content: (
      <div style={{ maxWidth: '220px', textAlign: 'left' }}>
        <strong>Heads up!</strong>
        <p style={{ marginTop: '0.5rem' }}>
          Tooltips accept arbitrary React nodes, making it easy to add emphasis or additional formatting.
        </p>
      </div>
    ),
    children: <Button text="Hover to read" />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how to pass complex JSX via the `content` prop for richer messaging.',
      },
    },
  },
};
