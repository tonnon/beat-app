import type { Meta, StoryObj } from '@storybook/react';
import Card from '@/components/card/Card';
import type { CardStatus } from '@/components/card/Card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card/Card',
  component: Card,
  args: {
    responsesLabel: 'Respuestas',
    continueLabel: 'Continuar',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Card>;

type CardStoryArgs = {
  status: CardStatus;
  progress: number;
};

const createArgs = ({ status, progress }: CardStoryArgs) => ({
  id: `${status}-${progress}`,
  title: 'Datos demográficos',
  status,
  statusLabel:
    status === 'completed'
      ? 'Completado'
      : status === 'in_progress'
        ? 'En curso'
        : 'Sin iniciar',
  progress,
});

export const Completed: Story = {
  args: {
    ...createArgs({ status: 'completed', progress: 100 }),
  },
};

export const InProgress: Story = {
  args: {
    ...createArgs({ status: 'in_progress', progress: 65 }),
  },
};

export const NotStarted: Story = {
  args: {
    ...createArgs({ status: 'not_started', progress: 0 }),
  },
};
