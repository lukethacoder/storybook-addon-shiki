/**
 * preset.ts — Storybook Preset
 *
 * This is the main integration point. It does three things:
 *
 * 1. Registers the preview entry (styles + global annotations).
 * 2. Aliases react-syntax-highlighter imports inside the preview iframe to
 *    our thin shims so Storybook's own SyntaxHighlighter is powered by Shiki.
 * 3. The same aliases also cover any third-party addons that import from
 *    react-syntax-highlighter directly.
 *
 * Framework-agnostic: supports both Vite and Webpack 5 builders.
 */

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ShikiAddonOptions } from './types';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/** Resolves a path relative to this package's src/ folder (at dev time) or
 *  dist/ folder (when published). tsup copies shims alongside the built output. */
const r = (...parts: string[]) => resolve(__dirname, ...parts);

// ---------------------------------------------------------------------------
// Preset entry points
// ---------------------------------------------------------------------------

export const previewAnnotations = () => [r('preview')];

// ---------------------------------------------------------------------------
// Vite integration
// ---------------------------------------------------------------------------

export async function viteFinal(config: Record<string, unknown>, options: { shiki?: ShikiAddonOptions }) {
  const { mergeConfig } = await import('vite');

  const addonOptions = options?.shiki ?? {};
  const aliases = buildAliases(r);

  return mergeConfig(config as object, {
    plugins: [
      transformComponentsPlugin(r),
      transformBlocksPlugin(r),
      debugAliasPlugin(),
      shikiOptionsPlugin(addonOptions),
    ],
    resolve: {
      alias: aliases,
    },
    optimizeDeps: {
      // Exclude from Vite's dependency pre-bundling so our aliases can intercept
      exclude: [
        'shiki',
        '@shikijs/core',
        '@shikijs/langs',
        '@shikijs/themes',
        // 'react-syntax-highlighter',
        '@lukethacoder/storybook-addon-shiki/options', // Virtual module
        '@lukethacoder/storybook-addon-shiki', // Our own package
      ],
      include: [],
    },
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

  // Convert array format to object format for Webpack
  const aliasesArray = buildAliases(r);
  const aliasesObject: Record<string, string> = {};
  for (const alias of aliasesArray) {
    if (typeof alias.find === 'string') {
      aliasesObject[alias.find] = alias.replacement;
    }
    // Webpack doesn't support regex aliases in the same way, skip those
  }

  return {
    ...config,
    resolve: {
      ...(config.resolve as object),
      alias: {
        ...existingAlias,
        ...aliasesObject,
        '@lukethacoder/storybook-addon-shiki/options': optionsDataUri,
        'storybook/internal/components': r('proxy/components-proxy.js'),
        '@storybook/addon-docs/blocks': r('proxy/blocks-proxy.js'),
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Shared alias map
// ---------------------------------------------------------------------------

/**
 * Builds the alias map that re-routes syntax highlighters to our shims.
 *
 * Order matters for Vite: more specific paths must come before less specific
 * ones. We use an array to ensure proper ordering.
 */
function buildAliases() {
  return [];
}

// ---------------------------------------------------------------------------
// Vite virtual-module plugin for runtime options
// ---------------------------------------------------------------------------

const VIRTUAL_MODULE_ID = '@lukethacoder/storybook-addon-shiki/options';
const RESOLVED_ID = `\0${VIRTUAL_MODULE_ID}`;

function shikiOptionsPlugin(options: ShikiAddonOptions) {
  return {
    name: '@lukethacoder/storybook-addon-shiki:options',
    enforce: 'pre' as const,
    resolveId(id: string) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_ID;
      }
    },
    load(id: string) {
      if (id === RESOLVED_ID) {
        const code = `export const shikiOptions = ${JSON.stringify(options)};`;
        return code;
      }
    },
  };
}

// Plugin to intercept and replace storybook/internal/components module
function transformComponentsPlugin(resolve: (...parts: string[]) => string) {
  const proxyPath = resolve('proxy/components-proxy.js');

  return {
    name: '@lukethacoder/storybook-addon-shiki:replace-components',
    enforce: 'pre' as const,

    async resolveId(id: string, importer: string | undefined) {
      // Intercept storybook/internal/components, but NOT when imported from our proxy
      if (id === 'storybook/internal/components') {
        const normalizedImporter = importer?.replace(/\\/g, '/') || '';
        const isFromProxy = normalizedImporter.includes('components-proxy');

        if (isFromProxy) {
          return null; // Let Vite resolve normally
        }

        return proxyPath;
      }
      return null;
    },
  };
}

// Plugin to intercept and replace @storybook/addon-docs/blocks module
function transformBlocksPlugin(resolve: (...parts: string[]) => string) {
  const proxyPath = resolve('proxy/blocks-proxy.js');

  return {
    name: '@lukethacoder/storybook-addon-shiki:replace-blocks',
    enforce: 'pre' as const,

    async resolveId(id: string, importer: string | undefined) {
      // Intercept @storybook/addon-docs/blocks, but NOT when imported from our proxy
      if (id === '@storybook/addon-docs/blocks') {
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

// Debug plugin to verify aliases are being applied
function debugAliasPlugin() {
  return {
    name: '@lukethacoder/storybook-addon-shiki:debug-alias',
    enforce: 'pre' as const,
    resolveId() {
      return null; // Let other resolvers handle it
    },
  };
}
