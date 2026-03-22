export interface Result {
  divs: DOMRect[];
  styled: DOMRect[];
}

import type { BundledLanguage, BundledTheme, HighlighterGeneric } from 'shiki';

/**
 * Transformer configuration - opt-in to specific Shiki transformers.
 * Requires @shikijs/transformers to be installed as a peer dependency.
 *
 * Set to `true` to enable a transformer, `false` or `undefined` to disable.
 */
export interface TransformerConfig {
  /**
   * Add a "focus" effect to specific lines
   * @see https://shiki.style/packages/transformers#transformerfocusline
   */
  focus?: boolean;
  /**
   * Highlight specific lines with different background colors
   * @see https://shiki.style/packages/transformers#transformerhighlight
   */
  highlight?: boolean;
  /**
   * Add diff indicators (+/-) to lines
   * @see https://shiki.style/packages/transformers#transformerdiff
   */
  diff?: boolean;
  /**
   * Add notation-style highlights (e.g., [!code highlight])
   * @see https://shiki.style/packages/transformers#transformernotationhighlight
   */
  notationHighlight?: boolean;
  /**
   * Add notation-style diffs (e.g., [!code ++] or [!code --])
   * @see https://shiki.style/packages/transformers#transformernotationdiff
   */
  notationDiff?: boolean;
  /**
   * Add notation-style focus (e.g., [!code focus])
   * @see https://shiki.style/packages/transformers#transformernotationfocus
   */
  notationFocus?: boolean;
  /**
   * Add notation-style error/warning indicators
   * @see https://shiki.style/packages/transformers#transformernotationerrorlevel
   */
  notationErrorLevel?: boolean;
  /**
   * Add notation-style word highlighting
   * @see https://shiki.style/packages/transformers#transformernotationwordhighlight
   */
  notationWordHighlight?: boolean;
  /**
   * Colorize matching bracket pairs with different colors
   * Note: Requires @shikijs/colorized-brackets package (separate from @shikijs/transformers)
   * @see https://shiki.style/packages/colorized-brackets
   */
  colorizedBrackets?: boolean;
  /**
   * Compact consecutive empty lines
   * @see https://shiki.style/packages/transformers#transformercompactlinecompact
   */
  compactLineOptions?: boolean;
  /**
   * Remove specific lines from the output
   * @see https://shiki.style/packages/transformers#transformerremovelineremove
   */
  removeLineRemove?: boolean;
}

/**
 * Options for configuring the Shiki addon.
 * These can be set in .storybook/main.ts when registering the addon,
 * or overridden per-story via parameters.shiki.
 */
export interface ShikiAddonOptions {
  /**
   * The Shiki theme to use for syntax highlighting.
   * @default 'vitesse-dark'
   */
  theme?: BundledTheme | string;

  /**
   * Languages to pre-load. Shiki loads grammars lazily by default; listing
   * the languages your docs use here avoids any first-render flash.
   *
   * @default Common web languages are loaded automatically.
   */
  langs?: (BundledLanguage | string)[];

  /**
   * Provide your own pre-built Shiki highlighter instance. When supplied the
   * addon will use it as-is and skip its own initialisation. Useful if you
   * already create a highlighter in your Storybook config.
   */
  highlighter?: HighlighterGeneric<BundledLanguage, BundledTheme>;

  /**
   * Configure which Shiki transformers to enable globally.
   * Requires @shikijs/transformers to be installed.
   *
   * @example
   * ```ts
   * transformers: {
   *   focus: true,
   *   highlight: true,
   *   diff: true,
   * }
   * ```
   */
  transformers?: TransformerConfig;
}

/**
 * Props accepted by the ShikiHighlighter component (mirrors the Storybook
 * SyntaxHighlighter API so it can act as a drop-in replacement).
 */
export interface ShikiHighlighterProps {
  children: string;
  language?: string;
  /**
   * Show a "Copy" button in the top-right corner.
   */
  copyable?: boolean;
  /**
   * Render a border around the block.
   */
  bordered?: boolean;
  /**
   * Add internal padding.
   */
  padded?: boolean;
  /**
   * Display line numbers.
   */
  showLineNumbers?: boolean;
  /**
   * Extra class names for the outer wrapper.
   */
  className?: string;
  /**
   * Inline CSS for the outer wrapper.
   */
  wrapperStyle?: React.CSSProperties;
  /**
   * Called with the formatted code string before it is highlighted. You can
   * use this to run Prettier or any other formatter.
   */
  formatter?: (code: string) => Promise<string> | string;
}

// Re-export for consumers
export type { BundledLanguage, BundledTheme };

// Trick to get React types without importing React at runtime in non-JSX files.
import type React from 'react';
