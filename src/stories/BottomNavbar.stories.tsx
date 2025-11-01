import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import BottomNavbar from '@/components/navbar/bottom-navbar/BottomNavbar';

const meta: Meta<typeof BottomNavbar> = {
  title: 'Components/BottomNavbar',
  component: BottomNavbar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Bottom navigation bar with animated floating indicator. Supports both controlled and uncontrolled modes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    activeIndex: {
      control: { type: 'number', min: 0, max: 4 },
      description: 'Current active tab index (controlled mode)',
    },
    defaultActiveIndex: {
      control: { type: 'number', min: 0, max: 4 },
      description: 'Initial active tab index (uncontrolled mode)',
    },
  },
};

export default meta;

type Story = StoryObj<typeof BottomNavbar>;

export const Default: Story = {
  args: {
    activeIndex: 0,
    defaultActiveIndex: 3
  },

  render: function DefaultExample() {
    const [activeIndex, setActiveIndex] = useState(0);
    const labels = ['Checklist', 'Education', 'Head Circuit', 'Graphic', 'Comment'];

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '2rem',
          background: '#f5f8fb',
          padding: '2rem',
        }}
      >
        <div style={{
          textAlign: 'center',
          color: '#374151',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Bottom Navigation
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            <p style={{ fontSize: '1rem', color: '#6b7280' }}>
              Active Index: <strong style={{ color: '#079FA4', fontSize: '1.5rem' }}>{activeIndex}</strong>
            </p>
            <span style={{ fontSize: '1.25rem', color: '#079FA4', fontWeight: 'bold' }}>→</span>
            <p style={{ fontSize: '1rem', color: '#6b7280' }}>
              <strong style={{ color: '#FFC700' }}>{labels[activeIndex]}</strong>
            </p>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '1rem' }}>
            Click on any item to change the active tab
          </p>
        </div>

        <BottomNavbar
          activeIndex={activeIndex}
          onChange={(index: number) => {
            setActiveIndex(index);
          }}
        />
      </div>
    );
  }
};