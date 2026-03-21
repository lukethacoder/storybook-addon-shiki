import { defineMain } from '@storybook/react-vite/node';

import { type ShikiAddonOptions } from '../src/types';

const storybookAddonShikiOptions: ShikiAddonOptions = {
  theme: 'one-dark-pro',
  langs: [
    'jsx',
    'tsx',
    'typescript',
    'javascript',
    'css',
    'html',
    'bash',
    'json',
    'yaml',
    'markdown',
    'graphql',
    'svelte',
  ],
};

const config = defineMain({
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    {
      name: import.meta.resolve('./local-preset.ts'),
      options: {
        shiki: storybookAddonShikiOptions,
      },
    },
  ],
  framework: '@storybook/react-vite',
});

export default config;
