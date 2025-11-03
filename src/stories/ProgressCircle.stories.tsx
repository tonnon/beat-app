import type { Meta, StoryObj } from '@storybook/react';
import ProgressCircle from '@/components/progress/progress-circle/ProgressCircle';
import ProgressLinear from '@/components/progress/progress-linear/ProgressLinear';

const meta = {
  title: 'Components/Progress Indicators',
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

type CircleStory = StoryObj<typeof meta>;

export const CircleDefault: CircleStory = {};

export const CircleCompleted: CircleStory = {
  args: {
    value: 100,
  },
};

export const CircleCustomSizeAndColor: CircleStory = {
  args: {
    value: 45,
    size: 140,
    color: '#079FA4',
  },
};

type LinearStory = StoryObj<typeof ProgressLinear>;

export const LinearSoft: LinearStory = {
  args: {
    value: 45,
    label: 'Soft variant',
  },
};

export const LinearSolid: LinearStory = {
  args: {
    value: 75,
    label: 'Solid variant',
    variant: 'solid',
  },
};
