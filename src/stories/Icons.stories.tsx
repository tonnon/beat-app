import type { Meta, StoryObj } from '@storybook/react';
import {
  ChecklistIcon,
  CommentIcon,
  EducationIcon,
  GraphIcon,
  HeadCircuitIcon,
  UserIcon,
  StarIcon,
  PenIcon,
  SettingsIcon,
  LogoutIcon,
  IconSizes,
  getIconSize,
  type IconSize,
} from '@/components/icons/Icons';

const IconDisplay = ({
  IconComponent,
  size = 'md',
  name
}: {
  IconComponent: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  size?: IconSize;
  name: string;
}) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    minWidth: '120px',
    backgroundColor: '#fff'
  }}>
    <IconComponent size={getIconSize(size)} style={{ color: '#374151' }} />
    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#111827' }}>{name}</span>
    <span style={{ fontSize: '0.625rem', color: '#6b7280' }}>
      {typeof size === 'number' ? `${size}px` : `${size} (${getIconSize(size)}px)`}
    </span>
  </div>
);

const meta: Meta = {
  title: 'Design System/Icons',
  component: ChecklistIcon,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Icon System

A centralized icon system built on top of React Icons with consistent sizing and naming conventions.

## Features
- **Consistent Naming**: All icons follow a clear naming pattern
- **Size Variants**: Predefined sizes from xs (12px) to 2xl (48px)
- **Tree Shaking**: Only imports icons that are actually used
- **Type Safety**: Full TypeScript support with proper types
- **Accessibility**: Icons include proper ARIA attributes

## Available Icons
- **ChecklistIcon** - Task/checklist indicator
- **CommentIcon** - Comment/message indicator
- **EducationIcon** - Education/learning related
- **GraphIcon** - Graph/statistics visualization
- **HeadCircuitIcon** - AI/technology related
- **UserIcon** - User/profile avatar placeholder
- **StarIcon** - Awards, badges or achievements
- **PenIcon** - Drafts or edit actions
- **SettingsIcon** - Preferences and configuration
- **LogoutIcon** - Sign out or exit actions

// With custom styling
<ChecklistIcon size={16} style={{ color: '#10b981' }} />
\`\`\`

## Size System
The icon system provides consistent sizing options:
- **xs**: 12px - For small UI elements
- **sm**: 16px - For compact interfaces  
- **md**: 20px - Default size
- **lg**: 24px - For headers and emphasis
- **xl**: 32px - For large features
- **2xl**: 48px - For heroes and logos
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const ICONS = [
  { component: ChecklistIcon, name: 'ChecklistIcon' },
  { component: CommentIcon, name: 'CommentIcon' },
  { component: EducationIcon, name: 'EducationIcon' },
  { component: GraphIcon, name: 'GraphIcon' },
  { component: HeadCircuitIcon, name: 'HeadCircuitIcon' },
  { component: UserIcon, name: 'UserIcon' },
  { component: StarIcon, name: 'StarIcon' },
  { component: PenIcon, name: 'PenIcon' },
  { component: SettingsIcon, name: 'SettingsIcon' },
  { component: LogoutIcon, name: 'LogoutIcon' },
] as const;

export const AllIcons: Story = {
  name: 'All Available Icons',
  parameters: {
    docs: {
      description: {
        story: 'Complete gallery of all available icons in the system with their names.',
      },
    },
  },
  render: () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '1rem',
      padding: '2rem',
      backgroundColor: '#f9fafb',
      borderRadius: '8px'
    }}>
      {ICONS.map(({ component: IconComponent, name }) => (
        <IconDisplay key={name} IconComponent={IconComponent} name={name} />
      ))}
    </div>
  ),
};

export const SizeVariants: Story = {
  name: 'Size Variants',
  parameters: {
    docs: {
      description: {
        story: 'All available size variants from xs (12px) to 2xl (48px). Icons scale proportionally while maintaining visual consistency.',
      },
    },
  },
  render: () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      padding: '2rem',
      backgroundColor: '#fff'
    }}>
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
          Icon Sizes Comparison
        </h3>
        <div style={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'end',
          flexWrap: 'wrap',
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px'
        }}>
          <IconDisplay IconComponent={ChecklistIcon} size="xs" name="XS" />
          <IconDisplay IconComponent={ChecklistIcon} size="sm" name="SM" />
          <IconDisplay IconComponent={ChecklistIcon} size="md" name="MD" />
          <IconDisplay IconComponent={ChecklistIcon} size="lg" name="LG" />
          <IconDisplay IconComponent={ChecklistIcon} size="xl" name="XL" />
          <IconDisplay IconComponent={ChecklistIcon} size="2xl" name="2XL" />
        </div>
      </div>

      <div style={{
        borderTop: '1px solid #e5e7eb',
        paddingTop: '2rem'
      }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
          Size Specifications
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '1rem',
          textAlign: 'center'
        }}>
          {(Object.entries(IconSizes) as Array<[string, number]>).map(([key, value]) => (
            <div key={key} style={{
              padding: '1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>
                {key.toUpperCase()}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {value}px
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const UsageExamples: Story = {
  name: 'Usage Examples',
  parameters: {
    docs: {
      description: {
        story: 'Practical examples showing how icons are used in different UI contexts with appropriate sizes.',
      },
    },
  },
  render: () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      padding: '2rem',
      backgroundColor: '#fff'
    }}>
      <div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
          In Navigation
        </h3>
        <div style={{
          display: 'flex',
          gap: '1rem',
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ChecklistIcon size={24} style={{ color: '#079FA4' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Checklist</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <EducationIcon size={24} style={{ color: '#079FA4' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Education</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HeadCircuitIcon size={24} style={{ color: '#079FA4' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>AI Circuit</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GraphIcon size={24} style={{ color: '#079FA4' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Analytics</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CommentIcon size={24} style={{ color: '#079FA4' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Comments</span>
          </div>
        </div>
      </div>

    </div>
  ),
};