/**
 * options-runtime.ts
 *
 * This file serves as a static fallback for the `@lukethacoder/storybook-addon-shiki/options`
 * virtual module. In normal usage the preset's viteFinal / webpackFinal hooks
 * replace this with a generated module containing the user's actual config.
 *
 * It is also used by the alias map in preset.ts as the Webpack `data:` URI
 * approach doesn't work in all environments.
 */
import type { ShikiAddonOptions } from './types';

// Will be replaced at build time by the preset — this export acts as the
// safe default so TypeScript and test environments don't break.
export const shikiOptions: ShikiAddonOptions = {};
