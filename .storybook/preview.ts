import type { Preview } from '@storybook/react-vite'
import '@radix-ui/themes/styles.css'
import '../src/styles/index.scss'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#f5f8fb',
        },
        {
          name: 'white',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1f2937',
        },
      ],
    },

    a11y: {
      test: 'todo'
    }
  },
};

export default preview;