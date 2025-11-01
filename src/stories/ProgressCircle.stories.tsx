import type { Meta, StoryObj } from '@storybook/react';
import ProgressCircle from '@/components/progress/progress-circle/ProgressCircle';

const meta = {
  title: 'Components/ProgressCircle',
  component: ProgressCircle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Circular progress indicator ranging from 0 to 100% with customizable colors.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    value: 65,
    label: 'Questionnaire completion',
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 5 },
    },
    size: {
      control: { type: 'number', min: 80, max: 160, step: 8 },
    },
  },
} satisfies Meta<typeof ProgressCircle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Completed: Story = {
  args: {
    value: 100,
  },
};

export const CustomSizeAndColor: Story = {
  args: {
    value: 45,
    size: 140,
    color: '#079FA4',
  },
};
