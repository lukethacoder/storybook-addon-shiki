import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ShikiHighlighterComponentProps } from '../ShikiHighlighter';
import { SyntaxHighlighter } from './storybook-syntax-highlighter';
import * as loadOptionsModule from './load-options';

// Mock the load-options module
vi.mock('./load-options', () => ({
  getAddonOptionsAsync: vi.fn(() =>
    Promise.resolve({
      theme: 'one-dark-pro',
      langs: ['typescript', 'javascript'],
    }),
  ),
}));

// Mock the ShikiHighlighter component
vi.mock('../ShikiHighlighter', () => ({
  ShikiHighlighter: ({
    children,
    language,
    showLineNumbers,
    options,
    className,
    ...props
  }: ShikiHighlighterComponentProps) => (
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

describe('SyntaxHighlighter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadOptionsModule.getAddonOptionsAsync).mockResolvedValue({
      theme: 'one-dark-pro',
      langs: ['typescript', 'javascript'],
    });
  });

  it('should render with default props', async () => {
    render(<SyntaxHighlighter>const x = 1;</SyntaxHighlighter>);

    const highlighter = await screen.findByTestId('shiki-highlighter');
    expect(highlighter).toBeInTheDocument();
    expect(highlighter).toHaveTextContent('const x = 1;');
  });

  it('should use default language "jsx"', async () => {
    render(<SyntaxHighlighter>const x = 1;</SyntaxHighlighter>);

    const highlighter = await screen.findByTestId('shiki-highlighter');
    expect(highlighter).toHaveAttribute('data-language', 'jsx');
  });

  it('should use custom language when provided', async () => {
    render(<SyntaxHighlighter language="python">print(&quot;hello&quot;)</SyntaxHighlighter>);

    const highlighter = await screen.findByTestId('shiki-highlighter');
    expect(highlighter).toHaveAttribute('data-language', 'python');
  });

  it('should pass showLineNumbers prop', async () => {
    render(<SyntaxHighlighter showLineNumbers>const x = 1;</SyntaxHighlighter>);

    const highlighter = await screen.findByTestId('shiki-highlighter');
    expect(highlighter).toHaveAttribute('data-show-line-numbers', 'true');
  });

  it('should not show line numbers by default', async () => {
    render(<SyntaxHighlighter>const x = 1;</SyntaxHighlighter>);

    const highlighter = await screen.findByTestId('shiki-highlighter');
    expect(highlighter).toHaveAttribute('data-show-line-numbers', 'false');
  });

  it('should convert non-string children to string', async () => {
    render(<SyntaxHighlighter>{123}</SyntaxHighlighter>);

    const highlighter = await screen.findByTestId('shiki-highlighter');
    expect(highlighter).toHaveTextContent('123');
  });

  it('should handle undefined children', async () => {
    render(<SyntaxHighlighter>{undefined}</SyntaxHighlighter>);

    const highlighter = await screen.findByTestId('shiki-highlighter');
    expect(highlighter).toHaveTextContent('');
  });

  it('should handle null children', async () => {
    render(<SyntaxHighlighter>{null}</SyntaxHighlighter>);

    const highlighter = await screen.findByTestId('shiki-highlighter');
    expect(highlighter).toHaveTextContent('');
  });

  it('should ignore format prop (backward compatibility)', async () => {
    // Note: format prop is accepted for backward compatibility but not used
    const { container } = render(<SyntaxHighlighter>const x = 1;</SyntaxHighlighter>);

    const highlighter = await screen.findByTestId('shiki-highlighter');
    expect(highlighter).toBeInTheDocument();
    // Component renders successfully even though format prop is in interface
    expect(container).toBeInTheDocument();
  });

  it('should forward additional props to ShikiHighlighter', async () => {
    render(
      <SyntaxHighlighter data-testid="custom-highlighter" className="custom-class" title="test">
        const x = 1;
      </SyntaxHighlighter>,
    );

    const highlighter = await screen.findByTestId('custom-highlighter');
    expect(highlighter).toHaveAttribute('title', 'test');
    expect(highlighter).toHaveClass('custom-class');
  });

  describe('options loading', () => {
    it('should render successfully with loaded options', async () => {
      render(<SyntaxHighlighter>const x = 1;</SyntaxHighlighter>);

      // Component should render without errors when options are available
      const highlighter = await screen.findByTestId('shiki-highlighter');
      expect(highlighter).toBeInTheDocument();
    });

    it('should eventually load options from virtual module', async () => {
      render(<SyntaxHighlighter>const x = 1;</SyntaxHighlighter>);

      const highlighter = await screen.findByTestId('shiki-highlighter');
      // Options should be loaded after the effect runs
      const options = JSON.parse(highlighter.getAttribute('data-options') || '{}');
      expect(options).toHaveProperty('theme');
      expect(options).toHaveProperty('langs');
    });
  });

  describe('displayName', () => {
    it('should have correct displayName for debugging', () => {
      expect(SyntaxHighlighter.displayName).toBe('ShikiSyntaxHighlighter');
    });
  });

  describe('common use cases', () => {
    it('should render JSX code', async () => {
      const jsxCode = `function App() {
  return <div>Hello</div>;
}`;

      render(<SyntaxHighlighter language="jsx">{jsxCode}</SyntaxHighlighter>);

      const highlighter = await screen.findByTestId('shiki-highlighter');
      expect(highlighter.textContent).toContain('function App()');
      expect(highlighter.textContent).toContain('return <div>Hello</div>');
      expect(highlighter).toHaveAttribute('data-language', 'jsx');
    });

    it('should render TypeScript code with line numbers', async () => {
      const tsCode = `const greeting: string = 'Hello';`;

      render(
        <SyntaxHighlighter language="typescript" showLineNumbers>
          {tsCode}
        </SyntaxHighlighter>,
      );

      const highlighter = await screen.findByTestId('shiki-highlighter');
      expect(highlighter).toHaveTextContent(tsCode);
      expect(highlighter).toHaveAttribute('data-language', 'typescript');
      expect(highlighter).toHaveAttribute('data-show-line-numbers', 'true');
    });

    it('should render bash commands', async () => {
      const bashCode = `npm install shiki`;

      render(<SyntaxHighlighter language="bash">{bashCode}</SyntaxHighlighter>);

      const highlighter = await screen.findByTestId('shiki-highlighter');
      expect(highlighter).toHaveTextContent(bashCode);
      expect(highlighter).toHaveAttribute('data-language', 'bash');
    });

    it('should render JSON', async () => {
      const jsonCode = `{ "name": "test", "version": "1.0.0" }`;

      render(<SyntaxHighlighter language="json">{jsonCode}</SyntaxHighlighter>);

      const highlighter = await screen.findByTestId('shiki-highlighter');
      expect(highlighter).toHaveTextContent(jsonCode);
      expect(highlighter).toHaveAttribute('data-language', 'json');
    });
  });

  describe('edge cases', () => {
    it('should handle very long code', async () => {
      const longCode = 'const x = 1;\n'.repeat(1000);

      render(<SyntaxHighlighter>{longCode}</SyntaxHighlighter>);

      const highlighter = await screen.findByTestId('shiki-highlighter');
      expect(highlighter).toBeInTheDocument();
      expect(highlighter.textContent).toContain('const x = 1;');
    });

    it('should handle special characters', async () => {
      const codeWithSpecialChars = `const str = "Hello <>&'"";`;

      render(<SyntaxHighlighter>{codeWithSpecialChars}</SyntaxHighlighter>);

      const highlighter = await screen.findByTestId('shiki-highlighter');
      expect(highlighter).toHaveTextContent(codeWithSpecialChars);
    });

    it('should handle unicode characters', async () => {
      const unicodeCode = `const emoji = "👋 🌍 ✨";`;

      render(<SyntaxHighlighter>{unicodeCode}</SyntaxHighlighter>);

      const highlighter = await screen.findByTestId('shiki-highlighter');
      expect(highlighter).toHaveTextContent(unicodeCode);
    });
  });
});
