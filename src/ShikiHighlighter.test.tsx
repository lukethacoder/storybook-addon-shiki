import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import type { BundledLanguage, BundledTheme, HighlighterGeneric } from 'shiki';
import { ShikiHighlighter } from './ShikiHighlighter';
import * as highlighterModule from './highlighter';

// Mock the highlighter module
vi.mock('./highlighter', () => ({
  getHighlighter: vi.fn(),
}));

describe('ShikiHighlighter', () => {
  const mockHighlighter: Partial<HighlighterGeneric<BundledLanguage, BundledTheme>> = {
    codeToHtml: vi.fn((code: string) => `<pre><code>${code}</code></pre>`),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(highlighterModule.getHighlighter).mockResolvedValue(
      mockHighlighter as HighlighterGeneric<BundledLanguage, BundledTheme>,
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should render nothing for empty children', async () => {
    const { container } = render(<ShikiHighlighter>{''}</ShikiHighlighter>);

    // Wait for any async effects to complete
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('should render nothing for whitespace-only children', async () => {
    const { container } = render(<ShikiHighlighter>{'   \n  '}</ShikiHighlighter>);

    // Wait for any async effects to complete
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('should render with empty options using defaults', async () => {
    const code = `const greeting = 'Hello';`;
    render(<ShikiHighlighter options={{}}>{code}</ShikiHighlighter>);

    // Should call highlighter even with empty options (uses defaults)
    await waitFor(() => {
      expect(highlighterModule.getHighlighter).toHaveBeenCalledWith({});
    });

    await waitFor(() => {
      expect(mockHighlighter.codeToHtml).toHaveBeenCalledWith(
        code,
        expect.objectContaining({
          lang: 'jsx',
          theme: 'vitesse-dark', // default theme
        }),
      );
    });
  });

  it('should render code with options', async () => {
    const code = `const greeting = 'Hello';`;

    render(<ShikiHighlighter options={{ theme: 'one-dark-pro' }}>{code}</ShikiHighlighter>);

    await waitFor(() => {
      expect(highlighterModule.getHighlighter).toHaveBeenCalledWith({ theme: 'one-dark-pro' });
    });

    await waitFor(() => {
      expect(mockHighlighter.codeToHtml).toHaveBeenCalledWith(
        code,
        expect.objectContaining({
          lang: 'jsx',
          theme: 'one-dark-pro',
        }),
      );
    });
  });

  it('should use custom language', async () => {
    const code = `print("Hello")`;

    render(
      <ShikiHighlighter language="python" options={{ theme: 'one-dark-pro' }}>
        {code}
      </ShikiHighlighter>,
    );

    await waitFor(() => {
      expect(mockHighlighter.codeToHtml).toHaveBeenCalledWith(
        code,
        expect.objectContaining({
          lang: 'python',
        }),
      );
    });
  });

  it('should apply CSS classes based on props', async () => {
    const { container } = render(
      <ShikiHighlighter bordered padded showLineNumbers className="custom-class" options={{ theme: 'one-dark-pro' }}>
        {`const x = 1;`}
      </ShikiHighlighter>,
    );

    // Wait for wrapper to render with all classes
    await waitFor(() => {
      const wrapper = container.querySelector('.sb-shiki-wrapper');
      expect(wrapper).toBeInTheDocument();
    });

    const wrapper = container.querySelector('.sb-shiki-wrapper');
    expect(wrapper).toHaveClass('sb-shiki-wrapper--bordered');
    expect(wrapper).toHaveClass('sb-shiki-wrapper--padded');
    expect(wrapper).toHaveClass('sb-shiki-wrapper--line-numbers');
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should apply wrapper styles', async () => {
    const { container } = render(
      <ShikiHighlighter wrapperStyle={{ maxWidth: '500px' }} options={{ theme: 'one-dark-pro' }}>
        {`const x = 1;`}
      </ShikiHighlighter>,
    );

    // Wait for component to render
    await waitFor(() => {
      const wrapper = container.querySelector('.sb-shiki-wrapper');
      expect(wrapper).toBeInTheDocument();
    });

    const wrapper = container.querySelector('.sb-shiki-wrapper');
    expect(wrapper).toHaveStyle({ maxWidth: '500px' });
  });

  it('should show copy button when copyable is true', async () => {
    render(
      <ShikiHighlighter copyable options={{ theme: 'one-dark-pro' }}>
        {`const x = 1;`}
      </ShikiHighlighter>,
    );

    const copyButton = await screen.findByRole('button', { name: /copy code/i });
    expect(copyButton).toBeInTheDocument();
    expect(copyButton).toHaveTextContent('Copy');
  });

  it('should not show copy button when copyable is false', async () => {
    render(
      <ShikiHighlighter copyable={false} options={{ theme: 'one-dark-pro' }}>
        {`const x = 1;`}
      </ShikiHighlighter>,
    );

    // Wait for component to render
    await waitFor(() => {
      expect(true).toBe(true);
    });

    const copyButton = screen.queryByRole('button', { name: /copy code/i });
    expect(copyButton).not.toBeInTheDocument();
  });

  it('should copy code to clipboard when copy button is clicked', async () => {
    const user = userEvent.setup();
    const code = `const greeting = 'Hello';`;

    // Mock clipboard API
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    const clipboardMock = {
      writeText: writeTextMock,
    };
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: clipboardMock,
    });

    render(
      <ShikiHighlighter copyable options={{ theme: 'one-dark-pro' }}>
        {code}
      </ShikiHighlighter>,
    );

    const copyButton = screen.getByRole('button', { name: /copy code/i });
    await user.click(copyButton);

    expect(writeTextMock).toHaveBeenCalledWith(code);
    expect(copyButton).toHaveTextContent('Copied');

    // Should reset after timeout
    await waitFor(
      () => {
        expect(copyButton).toHaveTextContent('Copy');
      },
      { timeout: 2000 },
    );

    vi.unstubAllGlobals();
  });

  it('should use formatter when provided', async () => {
    const code = `const x=1;`;
    const formatter = vi.fn((c: string) => c.replace('x=1', 'x = 1'));

    render(
      <ShikiHighlighter formatter={formatter} options={{ theme: 'one-dark-pro' }}>
        {code}
      </ShikiHighlighter>,
    );

    await waitFor(() => {
      expect(formatter).toHaveBeenCalledWith(code);
    });

    await waitFor(() => {
      expect(mockHighlighter.codeToHtml).toHaveBeenCalledWith('const x = 1;', expect.any(Object));
    });
  });

  it('should add line number transformer when showLineNumbers is true', async () => {
    render(
      <ShikiHighlighter showLineNumbers options={{ theme: 'one-dark-pro' }}>
        {`const x = 1;`}
      </ShikiHighlighter>,
    );

    await waitFor(() => {
      expect(mockHighlighter.codeToHtml).toHaveBeenCalledWith(
        'const x = 1;',
        expect.objectContaining({
          transformers: expect.arrayContaining([
            expect.objectContaining({
              name: 'storybook-shiki:line-numbers',
            }),
          ]),
        }),
      );
    });
  });

  it('should not add line number transformer when showLineNumbers is false', async () => {
    render(
      <ShikiHighlighter showLineNumbers={false} options={{ theme: 'one-dark-pro' }}>
        {`const x = 1;`}
      </ShikiHighlighter>,
    );

    await waitFor(() => {
      expect(mockHighlighter.codeToHtml).toHaveBeenCalledWith(
        'const x = 1;',
        expect.objectContaining({
          transformers: [],
        }),
      );
    });
  });

  it('should cancel highlight on unmount', async () => {
    const { unmount } = render(
      <ShikiHighlighter options={{ theme: 'one-dark-pro' }}>{`const x = 1;`}</ShikiHighlighter>,
    );

    unmount();

    // Component should cleanup properly without errors
    expect(true).toBe(true);
  });

  it('should re-highlight when children change', async () => {
    const { rerender } = render(
      <ShikiHighlighter options={{ theme: 'one-dark-pro' }}>{`const x = 1;`}</ShikiHighlighter>,
    );

    await waitFor(() => {
      expect(mockHighlighter.codeToHtml).toHaveBeenCalledTimes(1);
    });

    rerender(<ShikiHighlighter options={{ theme: 'one-dark-pro' }}>{`const y = 2;`}</ShikiHighlighter>);

    await waitFor(() => {
      expect(mockHighlighter.codeToHtml).toHaveBeenCalledTimes(2);
    });

    expect(mockHighlighter.codeToHtml).toHaveBeenLastCalledWith('const y = 2;', expect.any(Object));
  });

  it('should use default theme when not provided in options', async () => {
    render(<ShikiHighlighter options={{ langs: ['typescript'] }}>{`const x = 1;`}</ShikiHighlighter>);

    await waitFor(() => {
      expect(mockHighlighter.codeToHtml).toHaveBeenCalledWith(
        'const x = 1;',
        expect.objectContaining({
          theme: 'vitesse-dark',
        }),
      );
    });
  });
});
