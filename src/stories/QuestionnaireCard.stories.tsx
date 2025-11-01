import type { Meta } from '@storybook/react';

// This file previously duplicated the Card stories. The consolidated
// version now lives in `Card.stories.tsx`. We keep this stub so existing
// references resolve, but we hide it from Storybook navigation.

const meta = {
  title: 'Deprecated/QuestionnaireCard',
  parameters: {
    docs: {
      disable: true,
    },
    chromatic: { disableSnapshot: true },
    options: {
      showPanel: false,
    },
  },
} satisfies Meta;

export default meta;
