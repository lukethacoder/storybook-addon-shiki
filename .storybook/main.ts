import { defineMain } from '@storybook/react-vite/node';

import { type ShikiAddonOptions } from '../src/types';

// Example 1: Simple configuration with theme and languages
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

// Example 2: Configuration with transformers enabled
// Requires: npm install -D @shikijs/transformers @shikijs/colorized-brackets
// Uncomment to use:
const storybookAddonShikiOptionsWithTransformers: ShikiAddonOptions = {
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
  transformers: {
    // Enable notation-based features (use comments like [!code highlight])
    notationHighlight: true,
    notationDiff: true,
    notationFocus: true,
    notationErrorLevel: true,
    notationWordHighlight: true,
    // Enable meta-based features (use meta strings like {1-3})
    focus: true,
    highlight: true,
    // Enable diff indicators
    diff: true,
    // Enable colorized brackets (requires separate package: @shikijs/colorized-brackets)
    colorizedBrackets: true,
  },
};

// Example 3: Using a custom highlighter instance directly in stories
// (This example shows how to use it in your story files, not here)
// import { ShikiHighlighter } from '@lukethacoder/storybook-addon-shiki';
// import { createHighlighter } from 'shiki';
//
// const customHighlighter = await createHighlighter({
//   themes: ['github-light', 'nord'],
//   langs: ['rust', 'go'],
// });
//
// export const CustomHighlighter = () => (
//   <ShikiHighlighter
//     language="rust"
//     options={{ highlighter: customHighlighter, theme: 'github-light' }}
//   >
//     {`fn main() { println!("Hello"); }`}
//   </ShikiHighlighter>
// );

const config = defineMain({
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    // No configuration (uses defaults):
    // '@lukethacoder/storybook-addon-shiki',

    // Simple configuration (Example 1):
    // {
    //   name: '@lukethacoder/storybook-addon-shiki',
    //   options: {
    //     shiki: storybookAddonShikiOptions,
    //   },
    // },

    // With transformers enabled (Example 2):
    {
      name: '@lukethacoder/storybook-addon-shiki',
      options: {
        shiki: storybookAddonShikiOptionsWithTransformers,
      },
    },
  ],
  framework: '@storybook/react-vite',
});

export default config;
