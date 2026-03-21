import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ShikiAddonOptions, ShikiHighlighterProps } from './types';
import { getHighlighter } from './highlighter';

export interface ShikiHighlighterComponentProps extends ShikiHighlighterProps {
  /** Options forwarded from the preset / global config. */
  options?: ShikiAddonOptions;
}

// ---------------------------------------------------------------------------
// Copy-to-clipboard helper (works with both modern and legacy APIs)
// ---------------------------------------------------------------------------
async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for older browsers / non-secure contexts
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ShikiHighlighter({
  children,
  language = 'jsx',
  copyable = false,
  bordered = false,
  padded = false,
  showLineNumbers = false,
  className,
  wrapperStyle,
  formatter,
  options = {},
}: ShikiHighlighterComponentProps) {
  const [html, setHtml] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const theme = options.theme ?? 'vitesse-dark';

  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      if (typeof children !== 'string' || !children.trim()) return;

      // Wait for options to load from the virtual module before attempting to highlight.
      // This ensures we use the correct theme and languages from the config.
      const hasOptions = Object.keys(options).length > 0;
      if (!hasOptions) {
        console.log('[storybook-addon-shiki] Waiting for options to load...');
        return;
      }

      const rawCode = children.trim();
      const code = formatter ? await Promise.resolve(formatter(rawCode)) : rawCode;

      const highlighter = await getHighlighter(options);

      // Use single theme output with inline styles
      const result = highlighter.codeToHtml(code, {
        lang: language,
        theme: theme as never,
        transformers: showLineNumbers ? [lineNumberTransformer()] : [],
      });

      if (!cancelled) {
        setHtml(result);
      }
    }

    highlight();

    return () => {
      cancelled = true;
    };
  }, [children, language, theme, showLineNumbers, formatter, options]);

  const handleCopy = useCallback(() => {
    const code = typeof children === 'string' ? children.trim() : '';
    copyToClipboard(code).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    });
  }, [children]);

  if (typeof children !== 'string' || !children.trim()) {
    return null;
  }

  const wrapperClass = [
    'sb-shiki-wrapper',
    bordered ? 'sb-shiki-wrapper--bordered' : '',
    padded ? 'sb-shiki-wrapper--padded' : '',
    showLineNumbers ? 'sb-shiki-wrapper--line-numbers' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass} style={wrapperStyle}>
      <div
        className="sb-shiki-scroller"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: output is from Shiki, which escapes HTML
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {copyable && (
        <button
          type="button"
          className="sb-shiki-copy-button"
          onClick={handleCopy}
          aria-label={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shiki transformer: inject line-number spans so CSS can show them.
// Shiki v1 uses the `transformers` API from `@shikijs/core`.
// ---------------------------------------------------------------------------
function lineNumberTransformer() {
  return {
    name: 'storybook-shiki:line-numbers',
    line(node: { children: unknown[] }, line: number) {
      const element = node as unknown as { properties?: Record<string, unknown> };
      element.properties ??= {};
      element.properties['data-line'] = line;
    },
  };
}
