import { describe, it, expect, beforeEach } from 'vitest';
import type { BundledLanguage, BundledTheme, HighlighterGeneric } from 'shiki';
import { getHighlighter, resetHighlighter } from './highlighter';

describe('highlighter', () => {
  beforeEach(() => {
    resetHighlighter();
  });

  it('should create a highlighter with default options', async () => {
    const highlighter = await getHighlighter();
    expect(highlighter).toBeDefined();
    expect(typeof highlighter.codeToHtml).toBe('function');
  });

  it('should create a highlighter with custom theme', async () => {
    const highlighter = await getHighlighter({
      theme: 'one-dark-pro',
    });
    expect(highlighter).toBeDefined();
  });

  it('should create a highlighter with custom languages', async () => {
    const highlighter = await getHighlighter({
      langs: ['typescript', 'javascript'],
    });
    expect(highlighter).toBeDefined();
  });

  it('should return cached highlighter on subsequent calls with same options object', async () => {
    const options = { theme: 'one-dark-pro' };
    const highlighter1 = await getHighlighter(options);
    const highlighter2 = await getHighlighter(options);
    expect(highlighter1).toBe(highlighter2);
  });

  it('should use custom highlighter if provided', async () => {
    const customHighlighter: Partial<HighlighterGeneric<BundledLanguage, BundledTheme>> = {
      codeToHtml: () => '<pre>test</pre>',
    };

    const result = await getHighlighter({
      highlighter: customHighlighter as HighlighterGeneric<BundledLanguage, BundledTheme>,
    });

    expect(result).toBe(customHighlighter);
  });

  it('should reset highlighter cache', async () => {
    const highlighter1 = await getHighlighter();
    resetHighlighter();
    const highlighter2 = await getHighlighter();

    // After reset, we get a new instance
    expect(highlighter1).not.toBe(highlighter2);
  });
});
