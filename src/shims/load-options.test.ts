import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAddonOptionsAsync } from './load-options';

// Mock the virtual module
vi.mock('storybook-addon-shiki/options', () => ({
  shikiOptions: {
    theme: 'one-dark-pro',
    langs: ['typescript', 'javascript'],
  },
}));

describe('load-options', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load options from the virtual module', async () => {
    const options = await getAddonOptionsAsync();

    expect(options).toEqual({
      theme: 'one-dark-pro',
      langs: ['typescript', 'javascript'],
    });
  });

  it('should cache the options promise', async () => {
    const promise1 = getAddonOptionsAsync();
    const promise2 = getAddonOptionsAsync();

    expect(promise1).toBe(promise2);
  });

  it('should return the same options on subsequent calls', async () => {
    const options1 = await getAddonOptionsAsync();
    const options2 = await getAddonOptionsAsync();

    expect(options1).toEqual(options2);
  });
});
