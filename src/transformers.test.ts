import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadTransformers } from './transformers';

// Mock the dynamic imports
vi.mock('@shikijs/transformers', () => ({
  transformerMetaHighlight: vi.fn(() => ({ name: 'meta-highlight' })),
  transformerNotationDiff: vi.fn(() => ({ name: 'notation-diff' })),
  transformerNotationHighlight: vi.fn(() => ({ name: 'notation-highlight' })),
  transformerNotationFocus: vi.fn(() => ({ name: 'notation-focus' })),
  transformerNotationErrorLevel: vi.fn(() => ({ name: 'notation-error-level' })),
  transformerNotationWordHighlight: vi.fn(() => ({ name: 'notation-word-highlight' })),
  transformerCompactLineOptions: vi.fn(() => ({ name: 'compact-line-options' })),
  transformerRemoveNotationEscape: vi.fn(() => ({ name: 'remove-notation-escape' })),
}));

vi.mock('@shikijs/colorized-brackets', () => ({
  transformerColorizedBrackets: vi.fn(() => ({ name: 'colorized-brackets' })),
}));

describe('loadTransformers', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should return empty array when no config provided', async () => {
    const result = await loadTransformers();
    expect(result).toEqual([]);
  });

  it('should return empty array when all config values are falsy', async () => {
    const result = await loadTransformers({
      focus: false,
      highlight: false,
      diff: false,
    });
    expect(result).toEqual([]);
  });

  it('should load notation highlight transformer when enabled', async () => {
    const result = await loadTransformers({
      notationHighlight: true,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: 'notation-highlight' });
  });

  it('should load multiple transformers when enabled', async () => {
    const result = await loadTransformers({
      notationHighlight: true,
      notationDiff: true,
      notationFocus: true,
    });

    expect(result).toHaveLength(3);
    expect(result.map((t) => t.name)).toContain('notation-highlight');
    expect(result.map((t) => t.name)).toContain('notation-diff');
    expect(result.map((t) => t.name)).toContain('notation-focus');
  });

  it('should load focus transformer (meta-based)', async () => {
    const result = await loadTransformers({
      focus: true,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: 'meta-highlight' });
  });

  it('should load diff transformer', async () => {
    const result = await loadTransformers({
      diff: true,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: 'notation-diff' });
  });

  it('should load colorized brackets transformer from separate package', async () => {
    const result = await loadTransformers({
      colorizedBrackets: true,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: 'colorized-brackets' });
  });

  it('should load transformers from both packages', async () => {
    const result = await loadTransformers({
      notationHighlight: true,
      colorizedBrackets: true,
    });

    expect(result).toHaveLength(2);
    expect(result.map((t) => t.name)).toContain('notation-highlight');
    expect(result.map((t) => t.name)).toContain('colorized-brackets');
  });

  it('should load all available transformers when all enabled', async () => {
    const result = await loadTransformers({
      focus: true,
      highlight: true,
      diff: true,
      notationHighlight: true,
      notationDiff: true,
      notationFocus: true,
      notationErrorLevel: true,
      notationWordHighlight: true,
      colorizedBrackets: true,
      compactLineOptions: true,
      removeLineRemove: true,
    });

    // Note: some transformers may be duplicates (e.g., diff uses notationDiff)
    expect(result.length).toBeGreaterThan(0);
    expect(result.map((t) => t.name)).toContain('colorized-brackets');
  });

  it('should only load transformers that are explicitly enabled', async () => {
    const result = await loadTransformers({
      notationHighlight: true,
      notationDiff: false,
      notationFocus: true,
    });

    expect(result).toHaveLength(2);
    expect(result.map((t) => t.name)).toContain('notation-highlight');
    expect(result.map((t) => t.name)).toContain('notation-focus');
    expect(result.map((t) => t.name)).not.toContain('notation-diff');
  });
});
