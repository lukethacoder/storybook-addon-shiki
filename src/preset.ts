/**
 * preset.ts — Storybook Preset
 *
 * This is the main integration point. It does three things:
 *
 * 1. Registers the preview entry (styles + global annotations).
 * 2. Intercepts Storybook's internal component modules (storybook/internal/components
 *    and @storybook/addon-docs/blocks) to inject our Shiki-powered syntax highlighters.
 * 3. Provides a virtual module for runtime configuration that is injected at build time.
 *
 * Framework-agnostic: supports both Vite and Webpack 5 builders.
 */

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ShikiAddonOptions } from './types';

console.log('[@lukethacoder/storybook-addon-shiki] [preset.ts] 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/** Resolves a path relative to this package's src/ folder (at dev time) or
 *  dist/ folder (when published). tsup copies shims alongside the built output. */
const r = (...parts: string[]) => resolve(__dirname, ...parts);

// ---------------------------------------------------------------------------
// Preset entry points
// ---------------------------------------------------------------------------

// Removed previewAnnotations - not needed for this addon's functionality
// and causes conflicts with Svelte framework preset

// ---------------------------------------------------------------------------
// Vite integration
// ---------------------------------------------------------------------------

export async function viteFinal(config: Record<string, unknown>, options: { shiki?: ShikiAddonOptions }) {
  const { mergeConfig } = await import('vite');

  console.log('[@lukethacoder/storybook-addon-shiki] [preset.ts] viteFinal() 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');

  const addonOptions = options?.shiki ?? {};

  const plugins = [transformComponentsPlugin(r), transformBlocksPlugin(r), shikiOptionsPlugin(addonOptions)];
  console.log(
    '[@lukethacoder/storybook-addon-shiki] Registering plugins:',
    plugins.map((p) => p.name),
  );

  return mergeConfig(config as object, {
    plugins,
  });
}

// ---------------------------------------------------------------------------
// Webpack 5 integration
// ---------------------------------------------------------------------------

export async function webpackFinal(config: Record<string, unknown>, options: { shiki?: ShikiAddonOptions }) {
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
        'storybook/internal/components': r('proxy/components-proxy.js'),
        '@storybook/addon-docs/blocks': r('proxy/blocks-proxy.js'),
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

// Plugin to intercept and replace storybook/internal/components module
function transformComponentsPlugin(resolve: (...parts: string[]) => string) {
  const proxyPath = resolve('proxy/components-proxy.js');
  console.log('[transformComponentsPlugin] Proxy path:', proxyPath);

  return {
    name: '@lukethacoder/storybook-addon-shiki:replace-components',
    enforce: 'pre' as const,

    async resolveId(id: string, importer: string | undefined) {
      // Temporarily log ALL resolutions to find storybook/internal/components
      if (id === 'storybook/internal/components' || (id.includes('internal') && id.includes('components'))) {
        console.log('[replace-components] 🎯 FOUND INTERNAL/COMPONENTS:', id, 'from:', importer);
      }

      // Log storybook-related modules
      if (id.includes('storybook') || id.includes('components')) {
        console.log('[replace-components] Checking:', id, 'from:', importer || 'NO IMPORTER');
      }

      // Only intercept storybook/internal/components when imported from user code
      if (id === 'storybook/internal/components') {
        console.log(
          '[replace-components] *** MATCHED storybook/internal/components *** from:',
          importer || 'NO IMPORTER',
        );

        if (!importer) {
          console.log('[replace-components] SKIP: No importer');
          return null; // No importer - don't intercept
        }

        const normalizedImporter = importer.replace(/\\/g, '/');

        // Don't intercept our own proxy (prevents circular resolution)
        if (normalizedImporter.includes('components-proxy')) {
          console.log('[replace-components] SKIP: From our proxy');
          return null;
        }

        // Allow interception from @storybook/addon-docs (it uses SyntaxHighlighter for the "Show code" panel)
        const isFromAddonDocs =
          normalizedImporter.includes('node_modules') && normalizedImporter.includes('@storybook/addon-docs');

        // Don't intercept from node_modules UNLESS it's addon-docs
        if (normalizedImporter.includes('node_modules') && !isFromAddonDocs) {
          console.log('[replace-components] SKIP: From node_modules (not addon-docs)');
          return null;
        }

        // Only intercept from user code or addon-docs
        const isUserCode =
          normalizedImporter.match(/\.(stories|story)\.(js|jsx|ts|tsx|svelte|vue)$/i) ||
          normalizedImporter.endsWith('.mdx') ||
          normalizedImporter.includes('/.storybook/') ||
          normalizedImporter.includes('\\.storybook\\');

        if (isUserCode || isFromAddonDocs) {
          console.log('[replace-components] ✅ INTERCEPTING:', isUserCode ? 'user code' : 'addon-docs');
          return proxyPath;
        }

        console.log('[replace-components] SKIP: Not user code');
        return null;
      }
      return null;
    },
  };
}

function transformBlocksPluginV2(resolve: (...parts: string[]) => string) {
  const proxyPath = resolve('proxy/blocks-proxy.js'); // .tsx -> .js in dist

  return {
    name: '@lukethacoder/storybook-addon-shiki:replace-blocks',
    enforce: 'pre' as const,

    async resolveId(id: string, importer: string | undefined) {
      // Only intercept @storybook/addon-docs/blocks when imported from user code
      if (id === '@storybook/addon-docs/blocks') {
        if (!importer) {
          return null; // No importer - don't intercept
        }

        const normalizedImporter = importer.replace(/\\/g, '/');

        // Don't intercept our own proxy (prevents circular resolution)
        if (normalizedImporter.includes('blocks-proxy')) {
          return null;
        }

        // Don't intercept from any node_modules (including Storybook internals)
        if (normalizedImporter.includes('node_modules')) {
          return null;
        }

        // Only intercept from user code: stories, MDX files, and docs
        const isUserCode =
          normalizedImporter.match(/\.(stories|story)\.(js|jsx|ts|tsx|svelte|vue)$/i) ||
          normalizedImporter.endsWith('.mdx') ||
          normalizedImporter.includes('/.storybook/') ||
          normalizedImporter.includes('\\.storybook\\') ||
          normalizedImporter.includes('@storybook');

        if (isUserCode) {
          return proxyPath;
        }

        return null;
      }
      return null;
    },
  };
}

function transformBlocksPlugin(resolve: (...parts: string[]) => string) {
  const proxyPath = resolve('proxy/blocks-proxy.js');

  return {
    name: '@lukethacoder/storybook-addon-shiki:replace-blocks',
    enforce: 'pre' as const,

    async resolveId(id: string, importer: string | undefined) {
      // Intercept @storybook/addon-docs/blocks, but NOT when imported from our proxy
      if (id === '@storybook/addon-docs/blocks') {
        console.log('[replace-blocks] 🎯 Intercepting @storybook/addon-docs/blocks from:', importer);
        const normalizedImporter = importer?.replace(/\\/g, '/') || '';
        const isFromProxy = normalizedImporter.includes('blocks-proxy');

        if (isFromProxy) {
          return null; // Let Vite resolve normally
        }

        return proxyPath;
      }
      return null;
    },
  };
}
