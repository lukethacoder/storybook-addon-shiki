/**
 * shims/mdx.tsx
 *
 * Shim for CodeOrSourceMdx component from @storybook/addon-docs/blocks
 * This intercepts inline code and code blocks in MDX files and renders them with Shiki.
 */

import React from 'react';
import { ShikiHighlighter } from '../ShikiHighlighter';
import { getAddonOptionsAsync } from './load-options';
import type { ShikiAddonOptions } from '../types';

// Cache the options promise
const optionsPromise: Promise<ShikiAddonOptions> = getAddonOptionsAsync();

interface CodeOrSourceMdxProps {
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}

/**
 * Our replacement for Storybook's CodeOrSourceMdx component.
 * This is used in MDX files for both inline code and code blocks.
 *
 * Original logic:
 * - If no className and single-line content → render as inline <Code>
 * - If className (e.g., "language-jsx") or multi-line → render as <Source> block
 */
export function CodeOrSourceMdx({ className, children, ...rest }: CodeOrSourceMdxProps) {
  const [options, setOptions] = React.useState<ShikiAddonOptions>({});

  React.useEffect(() => {
    optionsPromise.then(setOptions);
  }, []);

  const code = typeof children === 'string' ? children : String(children ?? '');

  // Check if this is inline code (no className, single-line)
  const isInlineCode = !className && !code.match(/[\n\r]/g);

  if (isInlineCode) {
    // For inline code, use a simple <code> tag styled appropriately
    return (
      <code
        style={{
          fontFamily: 'var(--font-code, monospace)',
          fontSize: '90%',
          padding: '0.2em 0.4em',
          margin: 0,
          backgroundColor: 'rgba(175, 184, 193, 0.2)',
          borderRadius: '6px',
        }}
        {...rest}
      >
        {code}
      </code>
    );
  }

  // Extract language from className (e.g., "language-jsx" → "jsx")
  const language = className ? className.split('-')[1] : 'text';

  // For code blocks, use our ShikiHighlighter
  return (
    <ShikiHighlighter language={language} showLineNumbers={false} options={options} {...rest}>
      {code}
    </ShikiHighlighter>
  );
}

// Set displayName for better debugging
CodeOrSourceMdx.displayName = 'ShikiCodeOrSourceMdx';
