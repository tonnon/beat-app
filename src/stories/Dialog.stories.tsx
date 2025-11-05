import type { Meta, StoryObj } from '@storybook/react';
import { useState, type ComponentProps } from 'react';
import Button from '@/components/button/Button';
import Dialog from '@/components/dialog/Dialog';

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modal dialog component built with Radix, supporting optional header and action area.',
      },
    },
  },
  args: {
    title: 'Delete questionnaire',
    subtitle: 'Are you sure you want to delete this questionnaire? This action cannot be undone.',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: false,
    onOpenChange: () => undefined,
    children: <p>This action will remove all responses linked to the questionnaire.</p>,
  },
  render: (args) => <DefaultDialogStory {...args} />, 
};

export const WithoutHeader: Story = {
  args: {
    isOpen: true,
    onOpenChange: () => undefined,
    title: '',
    subtitle: '',
    children: <p>This dialog has no header and can be used for simpler content.</p>,
  },
  render: (args) => <DialogWithoutHeaderStory {...args} />, 
};

function DefaultDialogStory(args: ComponentProps<typeof Dialog>) {
  const [open, setOpen] = useState(args.isOpen);

  return (
    <div style={{ minHeight: '300px' }}>
      <Button text="Open dialog" onClick={() => setOpen(true)} />
      <Dialog
        {...args}
        isOpen={open}
        onOpenChange={setOpen}
        actions={(
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button
              variant="border"
              text="Cancel"
              onClick={() => setOpen(false)}
            />
            <Button
              text="Delete"
              onClick={() => setOpen(false)}
            />
          </div>
        )}
      />
    </div>
  );
}

function DialogWithoutHeaderStory(args: ComponentProps<typeof Dialog>) {
  const [open, setOpen] = useState(args.isOpen);

  return (
    <Dialog
      {...args}
      isOpen={open}
      onOpenChange={setOpen}
    />
  );
}
