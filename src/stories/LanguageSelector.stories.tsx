import type { Meta, StoryObj } from '@storybook/react';
import LanguageSelector from '@/components/navbar/top-navbar/language-selector/LanguageSelector';
import i18n from '@/i18n/config';
import { withStorybookProviders } from '@/stories/decorators/withStorybookProviders';

const meta = {
  title: 'Components/LanguageSelector',
  component: LanguageSelector,
  decorators: [withStorybookProviders],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Language selector with i18next integration. Automatically detects the browser language and persists user preference in localStorage.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LanguageSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
        Current language: <strong>{i18n.language.toUpperCase()}</strong>
      </p>
      <LanguageSelector {...args} />
    </div>
  ),
};

export const InNavbar: Story = {
  render: (args) => (
    <div style={{
      background: '#fff',
      padding: '1rem 2rem',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      minWidth: '400px',
    }}>
      <div style={{ fontWeight: 'bold', color: '#079FA4' }}>Logo</div>
      <LanguageSelector {...args} />
    </div>
  ),
};
