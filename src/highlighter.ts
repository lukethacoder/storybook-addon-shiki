import type { BundledLanguage, BundledTheme, HighlighterGeneric } from 'shiki';
import type { ShikiAddonOptions } from './types';

// Languages loaded by default (mirrors what react-syntax-highlighter/prism-light
// registered in Storybook's own SyntaxHighlighter).
const DEFAULT_LANGS: BundledLanguage[] = [
  'jsx',
  'tsx',
  'typescript',
  'javascript',
  'css',
  'html',
  'bash',
  'json',
  'markdown',
];

const DEFAULT_THEME: BundledTheme = 'vitesse-dark';

let highlighterPromise: Promise<HighlighterGeneric<BundledLanguage, BundledTheme>> | null = null;
let currentOptions: ShikiAddonOptions | null = null;

/**
 * Returns a singleton Shiki highlighter. The promise is cached so repeated
 * calls are effectively synchronous after the first resolution.
 *
 * Call `resetHighlighter()` if you need to rebuild it with new options (e.g.
 * when Storybook hot-reloads the preview).
 */
export async function getHighlighter(
  options: ShikiAddonOptions = {},
): Promise<HighlighterGeneric<BundledLanguage, BundledTheme>> {
  // If a custom highlighter is supplied, use it directly.
  if (options.highlighter) {
    return options.highlighter;
  }

  // Rebuild if options have changed.
  if (highlighterPromise && currentOptions === options) {
    return highlighterPromise;
  }

  currentOptions = options;

  highlighterPromise = (async () => {
    // Dynamically import shiki so it is tree-shaken if this module is never
    // imported. The `createHighlighter` function from shiki accepts a fine-
    // grained bundle list — we only pull in what we need.
    const { createHighlighter } = await import('shiki');

    const theme = options.theme ?? DEFAULT_THEME;
    const langs = options.langs ?? DEFAULT_LANGS;

    return createHighlighter({ themes: [theme], langs });
  })();

  return highlighterPromise;
}

export function resetHighlighter(): void {
  highlighterPromise = null;
  currentOptions = null;
}
