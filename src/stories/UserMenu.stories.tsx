import type { Meta, StoryObj } from '@storybook/react';
import UserMenu from '@/components/navbar/top-navbar/user-menu/UserMenu';
import { withStorybookProviders } from '@/stories/decorators/withStorybookProviders';

const meta = {
  title: 'Components/UserMenu',
  component: UserMenu,
  decorators: [withStorybookProviders],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'User avatar dropdown with quick links for badges, communications, password changes, and session management. Built on the shared dropdown component and fully translated (ES/CA).',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof UserMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', padding: '2rem', background: '#f8fafc' }}>
      <span style={{ fontSize: '0.95rem', color: '#475569' }}>
        Hover the avatar to preview the menu options.
      </span>
      <UserMenu />
    </div>
  ),
};

export const InsideNavigation: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '2rem',
        padding: '1rem 2rem',
        minWidth: '420px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{ fontWeight: 600, color: '#0f172a' }}>Beat Dashboard</span>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Signed in as Maria Jensen</span>
      </div>
      <UserMenu />
    </div>
  ),
};
