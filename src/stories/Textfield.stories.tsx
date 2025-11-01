import type { Meta, StoryObj } from '@storybook/react';
import { useState, type ChangeEvent } from 'react';
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

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState('Sophia Johnson');

    return (
      <Textfield
        {...(args as Extract<typeof args, { variant?: 'default' }>)}
        variant="default"
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setValue(event.target.value)}
      />
    );
  },
  args: {
    label: 'Organization name',
    placeholder: 'e.g., Beat Corp',
    variant: 'default',
  },
};

export const DatePicker: Story = {
  render: (args) => {
    const [value, setValue] = useState<Date | null>(new Date());

    return (
      <div style={{ width: '320px' }}>
        <Textfield
          {...(args as Extract<typeof args, { variant: 'date-picker' }>)}
          variant="date-picker"
          value={value}
          onDateChange={(date: Date | null) => setValue(date)}
        />
      </div>
    );
  },
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
