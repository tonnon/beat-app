import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Dropdown, { type DropdownItem, type DropdownProps } from '@/components/dropdown/Dropdown';
import { StarIcon, PenIcon, SettingsIcon } from '@/components/icons/Icons';

const meta = {
  title: 'Components/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Base dropdown component built on Radix UI. Accepts custom trigger elements, item definitions, optional arrows, and supports disabling the default styling for tailored experiences.',
      },
    },
  },
  argTypes: {
    modal: {
      control: 'boolean',
      description: 'Whether the dropdown traps focus in a modal context',
    },
    align: {
      control: {
        type: 'inline-radio',
        options: ['start', 'center', 'end'],
      },
      description: 'Horizontal alignment relative to the trigger',
    },
    sideOffset: {
      control: { type: 'number', min: 0, max: 16, step: 1 },
      description: 'Offset in pixels between the trigger and the content',
    },
    arrow: {
      control: 'boolean',
      description: 'Toggles the arrow indicator on the dropdown content',
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

const BASE_ITEMS: DropdownItem[] = [
  {
    id: 'badges',
    icon: <StarIcon size={18} />,
    label: 'Badges',
    description: 'Track your achievements',
  },
  {
    id: 'communications',
    icon: <PenIcon size={18} />,
    label: 'Communications',
    description: 'Review recent updates',
  },
  {
    id: 'preferences',
    icon: <SettingsIcon size={18} />,
    label: 'Preferences',
    description: 'Adjust your account settings',
  },
];

type PlaygroundStoryProps = DropdownProps & {
  readonly trigger: DropdownProps['trigger'];
  readonly items: DropdownItem[];
};

function PlaygroundContent({ items, trigger, ...controls }: PlaygroundStoryProps) {
  const [lastSelected, setLastSelected] = useState<string | null>(null);

  const enhancedItems = items.map((item) => ({
    ...item,
    onSelect: () => {
      item.onSelect?.();
      setLastSelected(item.id);
    },
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
      <Dropdown
        {...controls}
        trigger={trigger}
        items={enhancedItems}
      />

      <div
        style={{
          minWidth: '220px',
          padding: '1rem',
          borderRadius: '0.75rem',
          background: '#f1f5f9',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
          color: '#0f172a',
        }}
      >
        <strong>Last selected:</strong>{' '}
        {lastSelected ? lastSelected.replace('-', ' ') : 'nothing yet'}
      </div>
    </div>
  );
}

export const Playground: Story = {
  args: {
    trigger: (
      <button
        type="button"
        style={{
          padding: '0.65rem 1.25rem',
          borderRadius: '999px',
          border: '1px solid rgba(7, 159, 164, 0.25)',
          background: '#ffffff',
          color: '#079fa4',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
        }}
      >
        Open Menu
      </button>
    ),
    items: BASE_ITEMS,
    modal: false,
    align: 'end',
    sideOffset: 6,
    arrow: true,
  },
  render: (args) => <PlaygroundContent {...(args as PlaygroundStoryProps)} />,
};