/**
 * shims/storybook-syntax-highlighter.tsx
 *
 * A standalone replacement for Storybook's SyntaxHighlighter component.
 * This does NOT import from storybook/internal/components to avoid circular dependencies.
 */

import React from 'react';
import { ShikiHighlighter } from '../ShikiHighlighter';
import { getAddonOptionsAsync } from './load-options';
import type { ShikiAddonOptions } from '../types';

// Cache the options promise
const optionsPromise: Promise<ShikiAddonOptions> = getAddonOptionsAsync();

interface StorybookSyntaxHighlighterProps {
  children?: React.ReactNode;
  language?: string;
  showLineNumbers?: boolean;
  format?: boolean;
  [key: string]: unknown;
}

/**
 * Our replacement for Storybook's SyntaxHighlighter.
 * This is what renders in the Docs "Show code" blocks.
 */
export function SyntaxHighlighter({
  children,
  language = 'jsx',
  showLineNumbers = false,
  ...rest
}: StorybookSyntaxHighlighterProps) {
  const [options, setOptions] = React.useState<ShikiAddonOptions>({});

  React.useEffect(() => {
    optionsPromise.then(setOptions);
  }, []);

  const code = typeof children === 'string' ? children : String(children ?? '');

  return (
    <ShikiHighlighter language={language} showLineNumbers={showLineNumbers} options={options} {...rest}>
      {code}
    </ShikiHighlighter>
  );
}

// Set displayName for better debugging
SyntaxHighlighter.displayName = 'ShikiSyntaxHighlighter';
