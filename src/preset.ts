/**
 * preset.ts — Storybook Preset
 *
 * This is the main integration point. It does two things:
 *
 * 1. Registers the preview entry (runtime patcher + global annotations).
 * 2. Provides a virtual module for runtime configuration that is injected at build time.
 *
 * The runtime patcher handles all syntax highlighting replacement at runtime,
 * making this approach framework-agnostic and resilient to Storybook internal changes.
 */

import type { ShikiAddonOptions } from './types';

// ---------------------------------------------------------------------------
// Preset entry points
// ---------------------------------------------------------------------------
// Note: previewAnnotations and managerEntries are auto-discovered by Storybook
// via package.json exports (./preview and ./manager), so we don't need to
// explicitly define them here. This prevents duplicate module loading.

/**
 * Inject options into manager HTML head so they're available before manager JS loads
 */
export function managerHead(head: string, options?: { shiki?: ShikiAddonOptions }) {
  const addonOptions = options?.shiki ?? {};

  return `
    ${head}
    <script>
      window.__STORYBOOK_ADDON_SHIKI_OPTIONS__ = ${JSON.stringify(addonOptions)};
    </script>
  `;
}

// TypeScript global augmentation
declare global {
  interface Window {
    __STORYBOOK_ADDON_SHIKI_OPTIONS__?: ShikiAddonOptions;
  }
}

// ---------------------------------------------------------------------------
// Manager integration (for Code Panel)
// ---------------------------------------------------------------------------

/**
 * Configure manager Vite to include the virtual options module
 */
export async function managerVite(config: Record<string, unknown>, options?: { shiki?: ShikiAddonOptions }) {
  const { mergeConfig } = await import('vite');

  const addonOptions = options?.shiki ?? {};

  return mergeConfig(config as object, {
    plugins: [shikiOptionsPlugin(addonOptions)],
  });
}

/**
 * Configure manager webpack to include the virtual options module
 */
export async function managerWebpack(config: Record<string, unknown>, options?: { shiki?: ShikiAddonOptions }) {
  const addonOptions = options?.shiki ?? {};
  const serialisedOptions = JSON.stringify(addonOptions);

  const existingAlias = ((config.resolve as Record<string, unknown>)?.alias as Record<string, string>) ?? {};

  // Webpack 5 supports `data:` URIs as module sources
  const optionsDataUri = `data:text/javascript,export const shikiOptions = ${encodeURIComponent(serialisedOptions)};`;

  return {
    ...config,
    resolve: {
      ...(config.resolve as object),
      alias: {
        ...existingAlias,
        '@lukethacoder/storybook-addon-shiki/options': optionsDataUri,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Vite integration
// ---------------------------------------------------------------------------

export async function viteFinal(config: Record<string, unknown>, options?: { shiki?: ShikiAddonOptions }) {
  const { mergeConfig } = await import('vite');

  const addonOptions = options?.shiki ?? {};

  return mergeConfig(config as object, {
    optimizeDeps: {
      // Exclude from Vite's dependency pre-bundling
      exclude: [
        'shiki',
        '@shikijs/core',
        '@shikijs/langs',
        '@shikijs/themes',
        '@lukethacoder/storybook-addon-shiki/options', // Virtual module
        '@lukethacoder/storybook-addon-shiki', // Our own package
      ],
      include: [],
    },
    plugins: [shikiOptionsPlugin(addonOptions)],
  });
}

// ---------------------------------------------------------------------------
// Webpack 5 integration
// ---------------------------------------------------------------------------

export async function webpackFinal(config: Record<string, unknown>, options?: { shiki?: ShikiAddonOptions }) {
  const addonOptions = options?.shiki ?? {};
  const serialisedOptions = JSON.stringify(addonOptions);

  const existingAlias = ((config.resolve as Record<string, unknown>)?.alias as Record<string, string>) ?? {};

  // Webpack 5 supports `data:` URIs as module sources, which we use to inject
  // the options without creating a temp file on disk.
  const optionsDataUri = `data:text/javascript,export const shikiOptions = ${encodeURIComponent(serialisedOptions)};`;

  return {
    ...config,
    resolve: {
      ...(config.resolve as object),
      alias: {
        ...existingAlias,
        '@lukethacoder/storybook-addon-shiki/options': optionsDataUri,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Vite plugins for module interception and configuration
// ---------------------------------------------------------------------------

const VIRTUAL_MODULE_ID = '@lukethacoder/storybook-addon-shiki/options';
const RESOLVED_ID = `\0${VIRTUAL_MODULE_ID}`;

function shikiOptionsPlugin(options: ShikiAddonOptions) {
  return {
    name: '@lukethacoder/storybook-addon-shiki:options',
    enforce: 'pre' as const,
    resolveId(id: string) {
      return id === VIRTUAL_MODULE_ID ? RESOLVED_ID : undefined;
    },
    load(id: string) {
      return id === RESOLVED_ID ? `export const shikiOptions = ${JSON.stringify(options)};` : undefined;
    },
  };
}
