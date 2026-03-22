/**
 * Type declarations for virtual modules injected at build time
 */

declare module '@lukethacoder/storybook-addon-shiki/options' {
  import type { ShikiAddonOptions } from './types';
  export const shikiOptions: ShikiAddonOptions;
}
