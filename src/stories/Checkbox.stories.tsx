import type { Meta, StoryObj } from '@storybook/react';
import { useState, type ComponentProps } from 'react';
import Checkbox from '@/components/checkbox/Checkbox';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Radix-based checkbox with customizable labels and controlled/uncontrolled states.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    label: 'I accept the terms of use',
    defaultChecked: false,
  },
  argTypes: {
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Disabled checkbox',
  },
};

function ControlledCheckboxStory(args: ComponentProps<typeof Checkbox>) {
  const [checked, setChecked] = useState<boolean | 'indeterminate'>(false);

  return (
    <Checkbox
      {...args}
      checked={checked}
      onCheckedChange={(value) => setChecked(value)}
      label={`Current state: ${checked === 'indeterminate' ? 'indeterminate' : checked ? 'checked' : 'unchecked'}`}
    />
  );
}

export const Controlled: Story = {
  render: (args) => <ControlledCheckboxStory {...args} />,
  args: {
    label: 'Current state: unchecked',
  },
};
