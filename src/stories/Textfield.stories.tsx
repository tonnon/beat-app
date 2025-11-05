import type { Meta, StoryObj } from '@storybook/react';
import { useState, type ChangeEvent, type ComponentProps } from 'react';
import Textfield from '@/components/textfield/Textfield';

const meta = {
  title: 'Components/Textfield',
  component: Textfield,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Input field supporting default text entry and a date picker powered by MUI Date Picker.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['default', 'date-picker'],
    },
    required: {
      control: 'boolean',
    },
    error: {
      control: 'boolean',
    },
  },
  tags: ['autodocs'],
  args: {
    id: 'full-name',
    label: 'Full name',
    placeholder: 'Enter your name',
    variant: 'default',
  },
} satisfies Meta<typeof Textfield>;

export default meta;

type Story = StoryObj<typeof meta>;

type DefaultVariantProps = Extract<ComponentProps<typeof Textfield>, { variant?: 'default' }>;
type DatePickerVariantProps = Extract<ComponentProps<typeof Textfield>, { variant: 'date-picker' }>;

export const Default: Story = {};

export const Required: Story = {
  args: {
    required: true,
  },
};

export const WithDescription: Story = {
  args: {
    description: 'Used to identify the participant within the system.',
  },
};

export const WithError: Story = {
  args: {
    error: true,
    defaultValue: 'Invalid value',
  },
};

export const PasswordField: Story = {
  args: {
    id: 'account-password',
    label: 'Password',
    placeholder: 'Create a password',
    type: 'password',
    autoComplete: 'new-password',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the built-in password visibility toggle and accessibility attributes.',
      },
    },
  },
};

export const Controlled: Story = {
  render: (args) => <ControlledTextfieldStory {...(args as DefaultVariantProps)} />, 
  args: {
    label: 'Organization name',
    placeholder: 'e.g., Beat Corp',
    variant: 'default',
  },
};

export const DatePicker: Story = {
  render: (args) => <DatePickerTextfieldStory {...(args as DatePickerVariantProps)} />, 
  args: {
    id: 'birth-date',
    label: 'Birth date',
    description: 'Select a date between 1930 and today.',
    variant: 'date-picker',
    minDate: new Date('1930-01-01'),
    maxDate: new Date(),
    placeholder: 'DD/MM/YYYY',
  },
};

function ControlledTextfieldStory(args: DefaultVariantProps) {
  const [value, setValue] = useState('Sophia Johnson');
  const { variant: _variant, ...rest } = args;
  void _variant;

  return (
    <Textfield
      {...rest}
      variant="default"
      value={value}
      onChange={(event: ChangeEvent<HTMLInputElement>) => setValue(event.target.value)}
    />
  );
}

function DatePickerTextfieldStory(args: DatePickerVariantProps) {
  const [value, setValue] = useState<Date | null>(new Date());
  const { variant: _variant, ...rest } = args;
  void _variant;

  return (
    <div style={{ width: '320px' }}>
      <Textfield
        {...rest}
        variant="date-picker"
        value={value}
        onDateChange={(date: Date | null) => setValue(date)}
      />
    </div>
  );
}
