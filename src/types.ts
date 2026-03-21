export interface Result {
  divs: DOMRect[];
  styled: DOMRect[];
}

import type { BundledLanguage, BundledTheme, HighlighterGeneric } from 'shiki';

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
