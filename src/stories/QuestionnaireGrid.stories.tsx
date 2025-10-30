import type { Meta, StoryObj } from '@storybook/react';
import QuestionnaireGrid from '@/layout/card-grid/CardGrid';
import type { CardModel } from '@/components/card/Card';

const meta: Meta<typeof QuestionnaireGrid> = {
  title: 'Components/Card/QuestionnaireGrid',
  component: QuestionnaireGrid,
  tags: ['autodocs'],
  argTypes: {
    responsesLabel: {
      control: 'text',
    },
    continueLabel: {
      control: 'text',
    },
  },
};

export default meta;

type Story = StoryObj<typeof QuestionnaireGrid>;

const SAMPLE_ITEMS: CardModel[] = [
  {
    id: 'completed-1',
    title: 'Datos demográficos',
    status: 'completed',
    statusLabel: 'Completado',
    progress: 100,
  },
  {
    id: 'progress-1',
    title: 'Estilo de vida',
    status: 'in_progress',
    statusLabel: 'En curso',
    progress: 72,
  },
  {
    id: 'not-started-1',
    title: 'Insomnio',
    status: 'not_started',
    statusLabel: 'Sin iniciar',
    progress: 0,
  },
];

export const Default: Story = {
  args: {
    questionnaires: SAMPLE_ITEMS,
    responsesLabel: 'Respuestas',
    continueLabel: 'Continuar',
    emptyTitle: 'No hay cuestionarios',
    emptyDescription: 'Prueba ajustando los filtros.',
  },
};

export const EmptyState: Story = {
  args: {
    questionnaires: [],
    responsesLabel: 'Respuestas',
    continueLabel: 'Continuar',
    emptyTitle: 'No hay cuestionarios disponibles',
    emptyDescription: 'Ajusta los filtros para ver otros resultados.',
  },
};
