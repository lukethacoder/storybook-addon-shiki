import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CodeOrSourceMdx } from './mdx';
import * as loadOptionsModule from './load-options';

// Mock the load-options module before importing the component
vi.mock('./load-options', () => ({
  getAddonOptionsAsync: vi.fn(() =>
    Promise.resolve({
      theme: 'one-dark-pro',
      langs: ['typescript'],
    })
  ),
}));

// Mock the ShikiHighlighter component
vi.mock('../ShikiHighlighter', () => ({
  ShikiHighlighter: ({ children, language, showLineNumbers, options, className, ...props }: any) => (
    <div
      data-testid="shiki-highlighter"
      data-language={language}
      data-show-line-numbers={String(showLineNumbers)}
      data-options={JSON.stringify(options)}
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
}));

describe('CodeOrSourceMdx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadOptionsModule.getAddonOptionsAsync).mockResolvedValue({
      theme: 'one-dark-pro',
      langs: ['typescript'],
    });
  });

  describe('inline code', () => {
    it('should render inline code for single-line content without className', async () => {
      render(<CodeOrSourceMdx>const x = 1;</CodeOrSourceMdx>);

      const inlineCode = await screen.findByText('const x = 1;');
      expect(inlineCode.tagName).toBe('CODE');
      // Check that inline styles are applied
      expect(inlineCode.style.fontFamily).toContain('monospace');
      expect(inlineCode.style.fontSize).toBe('90%');
    });

    it('should render inline code for empty string', async () => {
      const { container } = render(<CodeOrSourceMdx>{''}</CodeOrSourceMdx>);

      // Wait for any async effects to complete
      await waitFor(() => {
        expect(container.querySelector('code')).toBeInTheDocument();
      });

      const code = container.querySelector('code');
      expect(code).toHaveTextContent('');
    });

    it('should convert non-string children to string for inline code', async () => {
      render(<CodeOrSourceMdx>{123}</CodeOrSourceMdx>);

      const code = await screen.findByText('123');
      expect(code.tagName).toBe('CODE');
    });
  });

  describe('code blocks', () => {
    it('should render code block for multi-line content', async () => {
      const code = `const x = 1;\nconst y = 2;`;

      render(<CodeOrSourceMdx>{code}</CodeOrSourceMdx>);

      const highlighter = await screen.findByTestId('shiki-highlighter');
      expect(highlighter).toBeInTheDocument();
      expect(highlighter.textContent).toContain('const x = 1;');
      expect(highlighter.textContent).toContain('const y = 2;');
    });

    it('should render code block when className is provided', async () => {
      render(
        <CodeOrSourceMdx className="language-typescript">
          const x = 1;
        </CodeOrSourceMdx>
      );

      const highlighter = await screen.findByTestId('shiki-highlighter');
      expect(highlighter).toBeInTheDocument();
    });

    it('should extract language from className', async () => {
      render(
        <CodeOrSourceMdx className="language-python">
          print("hello")
        </CodeOrSourceMdx>
      );

      const highlighter = await screen.findByTestId('shiki-highlighter');
      expect(highlighter).toHaveAttribute('data-language', 'python');
    });

    it('should use "text" as default language when no className', async () => {
      const code = `line 1\nline 2`;

      render(<CodeOrSourceMdx>{code}</CodeOrSourceMdx>);

      const highlighter = await screen.findByTestId('shiki-highlighter');
      expect(highlighter).toHaveAttribute('data-language', 'text');
    });

    it('should handle different language formats', async () => {
      const languages = ['jsx', 'typescript', 'bash', 'json'];

      for (const lang of languages) {
        const { unmount } = render(
          <CodeOrSourceMdx className={`language-${lang}`}>
            const x = 1;
          </CodeOrSourceMdx>
        );

        const highlighter = await screen.findByTestId('shiki-highlighter');
        expect(highlighter).toHaveAttribute('data-language', lang);

        unmount();
      }
    });

    it('should not show line numbers by default', async () => {
      render(
        <CodeOrSourceMdx className="language-typescript">
          const x = 1;
        </CodeOrSourceMdx>
      );

      const highlighter = await screen.findByTestId('shiki-highlighter');
      expect(highlighter).toHaveAttribute('data-show-line-numbers', 'false');
    });
  });

  describe('options loading', () => {
    it('should render successfully with loaded options', async () => {
      render(
        <CodeOrSourceMdx className="language-typescript">
          const x = 1;
        </CodeOrSourceMdx>
      );

      // Component should render without errors when options are available
      const highlighter = await screen.findByTestId('shiki-highlighter');
      expect(highlighter).toBeInTheDocument();
    });

    it('should eventually load options from virtual module', async () => {
      render(
        <CodeOrSourceMdx className="language-rust">
          fn main() {'{'}
        </CodeOrSourceMdx>
      );

      const highlighter = await screen.findByTestId('shiki-highlighter');
      // Options should be loaded after the effect runs
      const options = JSON.parse(highlighter.getAttribute('data-options') || '{}');
      expect(options).toHaveProperty('theme');
      expect(options).toHaveProperty('langs');
    });
  });

  describe('props forwarding', () => {
    it('should forward additional props to inline code', async () => {
      render(
        <CodeOrSourceMdx data-testid="custom-code" title="test">
          inline
        </CodeOrSourceMdx>
      );

      const code = await screen.findByTestId('custom-code');
      expect(code).toHaveAttribute('title', 'test');
    });

    it('should forward additional props to ShikiHighlighter', async () => {
      render(
        <CodeOrSourceMdx
          className="language-typescript"
          data-testid="custom-highlighter"
          title="test"
        >
          const x = 1;
        </CodeOrSourceMdx>
      );

      const highlighter = await screen.findByTestId('custom-highlighter');
      expect(highlighter).toHaveAttribute('title', 'test');
    });
  });

  describe('displayName', () => {
    it('should have correct displayName for debugging', () => {
      expect(CodeOrSourceMdx.displayName).toBe('ShikiCodeOrSourceMdx');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined children', async () => {
      const { container } = render(<CodeOrSourceMdx>{undefined}</CodeOrSourceMdx>);

      // Wait for any async effects to complete
      await waitFor(() => {
        expect(container.querySelector('code')).toBeInTheDocument();
      });

      const code = container.querySelector('code');
      expect(code).toHaveTextContent('');
    });

    it('should handle null children', async () => {
      const { container } = render(<CodeOrSourceMdx>{null}</CodeOrSourceMdx>);

      // Wait for any async effects to complete
      await waitFor(() => {
        expect(container.querySelector('code')).toBeInTheDocument();
      });

      const code = container.querySelector('code');
      expect(code).toHaveTextContent('');
    });

    it('should handle className without language prefix', async () => {
      render(
        <CodeOrSourceMdx className="my-custom-class">
          const x = 1;
        </CodeOrSourceMdx>
      );

      // Should still render as block (has className), but language extraction fails gracefully
      const highlighter = await screen.findByTestId('shiki-highlighter');
      expect(highlighter).toBeInTheDocument();
    });

    it('should handle mixed newline characters', async () => {
      const code = 'line1\rline2\r\nline3\nline4';

      render(<CodeOrSourceMdx>{code}</CodeOrSourceMdx>);

      // Should be treated as multi-line (code block)
      const highlighter = await screen.findByTestId('shiki-highlighter');
      expect(highlighter).toBeInTheDocument();
    });
  });
});
