/**
 * shims/load-options.ts
 *
 * Loads the addon options that were injected by the preset as a virtual module
 * (`storybook-addon-shiki/options`).
 *
 * The virtual module is wired up by:
 *   - Vite:    the `shikiOptionsPlugin` in preset.ts resolves the module ID
 *              to an inline `export const shikiOptions = {...}` string.
 *   - Webpack: the `data:` URI alias in preset.ts does the same thing.
 *
 * If neither is available (unit tests, SSR) the import will throw and we
 * fall back to an empty options object — all Shiki defaults apply.
 *
 * NOTE: we use a plain dynamic import() so this module is free of any
 * Node.js `require` / `fs` calls, which would break in browser/ESM builds.
 */

import type { ShikiAddonOptions } from '../types';

let _promise: Promise<ShikiAddonOptions> | null = null;

export function getAddonOptionsAsync(): Promise<ShikiAddonOptions> {
  if (_promise) return _promise;

  _promise = import(
    /* @vite-ignore */
    /* webpackIgnore: true */
    'storybook-addon-shiki/options'
  )
    .then((mod: any) => {
      const opts = mod.shikiOptions ?? mod.default?.shikiOptions ?? {};
      return opts;
    })
    .catch((err) => {
      console.warn('[storybook-addon-shiki] Failed to load virtual options module:', err);
      return {};
    });

  return _promise;
}

// Also export as default for easier importing
export default getAddonOptionsAsync;
