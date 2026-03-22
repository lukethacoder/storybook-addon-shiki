/**
 * Proxy module for @storybook/addon-docs/blocks
 *
 * This module re-exports everything from the original @storybook/addon-docs/blocks
 * except CodeOrSourceMdx and Source, which we replace with our Shiki versions.
 */

import React from 'react';
import { CodeOrSourceMdx as ShikiCodeOrSourceMdx } from '../shims/mdx';
import { ShikiHighlighter } from '../ShikiHighlighter';
import { getAddonOptionsAsync } from '../shims/load-options';
import type { ShikiAddonOptions } from '../types';

// Cache the options promise
const optionsPromise: Promise<ShikiAddonOptions> = getAddonOptionsAsync();

// Shim for the Source component used in MDX
interface LocalSourceProps {
  code: string;
  language?: string;
  [key: string]: unknown;
}

function ShikiSource({ code, language = 'jsx', ...rest }: LocalSourceProps) {
  const [options, setOptions] = React.useState<ShikiAddonOptions>({});

  React.useEffect(() => {
    optionsPromise.then(setOptions);
  }, []);

  return (
    <ShikiHighlighter language={language} showLineNumbers={false} options={options} {...rest}>
      {code}
    </ShikiHighlighter>
  );
}

ShikiSource.displayName = 'ShikiSource';

export * from '@storybook/addon-docs/blocks';

// Export our Shiki-powered replacements
export { ShikiCodeOrSourceMdx as CodeOrSourceMdx };
export { ShikiSource as Source };
export { ShikiSource as Pre };
