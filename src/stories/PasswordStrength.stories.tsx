import type { Meta, StoryObj } from '@storybook/react';
import PasswordStrength, { type PasswordStrengthLevel } from '@/components/password-strength/PasswordStrength';

const EXAMPLES: Record<string, { password: string; strength: PasswordStrengthLevel }> = {
  weak: {
    password: '1234567',
    strength: 'weak',
  },
  medium: {
    password: 'Abcdef12',
    strength: 'medium',
  },
  strong: {
    password: 'Str0ng!Pass',
    strength: 'strong',
  },
};

const meta = {
  title: 'Components/PasswordStrength',
  component: PasswordStrength,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Visual feedback for password quality with localized guidance on unmet requirements.',
      },
    },
  },
  tags: ['autodocs'],
  args: EXAMPLES.strong,
  argTypes: {
    strength: {
      control: 'inline-radio',
      options: ['weak', 'medium', 'strong'],
    },
  },
} satisfies Meta<typeof PasswordStrength>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Strong: Story = {};

export const Medium: Story = {
  args: EXAMPLES.medium,
};

export const Weak: Story = {
  args: EXAMPLES.weak,
};

export const DynamicExample: Story = {
  render: (args) => {
    const example = args.strength === 'weak'
      ? EXAMPLES.weak
      : args.strength === 'medium'
        ? EXAMPLES.medium
        : EXAMPLES.strong;

    return (
      <PasswordStrength
        strength={example.strength}
        password={example.password}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Switch the **strength** control to preview the component states with representative passwords.',
      },
    },
  },
};
