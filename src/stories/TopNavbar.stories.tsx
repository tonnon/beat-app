import type { Meta, StoryObj } from '@storybook/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import TopNavbar from '@/components/navbar/top-navbar/TopNavbar';
import i18n from '@/i18n/config';

const meta = {
  title: 'Components/TopNavbar',
  component: TopNavbar,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <Story />
        </I18nextProvider>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Fixed top navigation bar with scroll-triggered shadow animation. Integrated with i18next for multilingual support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    scrollThreshold: {
      control: { type: 'number', min: 0, max: 200, step: 10 },
      description: 'Pixels de scroll antes de ativar a sombra',
    },
  },
} satisfies Meta<typeof TopNavbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    scrollThreshold: 10,
  },
  render: (args) => (
    <div>
      <TopNavbar {...args} />
      
      {/* Scrollable content to demonstrate shadow behavior */}
      <div style={{ paddingTop: '80px', minHeight: '200vh', padding: '100px 20px' }}>
        <h1>Scroll the page to trigger the animation</h1>
        <p>The navbar adds a soft shadow once you scroll past the threshold.</p>
        <p style={{ marginTop: '2rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px' }}>
          <strong>💡 Highlights:</strong><br />
          • Dynamic translations (ES/CA)<br />
          • Clickable logo that links back home<br />
          • Navigation links with hover animation<br />
          • Integrated language selector
        </p>
        <div style={{ marginTop: '50vh' }}>
          <h2>Keep scrolling…</h2>
          <p>Use the language selector to switch between Spanish and Catalan.</p>
        </div>
        <div style={{ marginTop: '50vh' }}>
          <h2>Almost there…</h2>
        </div>
      </div>
    </div>
  ),
};

export const CustomScrollThreshold: Story = {
  args: {
    scrollThreshold: 100,
  },
  render: (args) => (
    <div>
      <TopNavbar {...args} />
      
      <div style={{ paddingTop: '80px', minHeight: '200vh', padding: '100px 20px' }}>
        <h1>100px Scroll Threshold</h1>
        <p>The shadow appears only after scrolling 100px.</p>
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>
          Current language: <strong>{i18n.language.toUpperCase()}</strong>
        </p>
        <div style={{ marginTop: '50vh' }}>
          <h2>Keep scrolling…</h2>
        </div>
      </div>
    </div>
  ),
};
