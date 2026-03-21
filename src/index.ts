import { definePreviewAddon } from 'storybook/internal/csf';

import addon from './preview';

export default () => definePreviewAddon(addon);

// Export components for use in the virtual module
export { ShikiHighlighter } from './ShikiHighlighter';
export { getHighlighter, resetHighlighter } from './highlighter';
export type { ShikiAddonOptions, ShikiHighlighterProps } from './types';
