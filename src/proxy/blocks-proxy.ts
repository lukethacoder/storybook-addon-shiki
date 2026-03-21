/**
 * Proxy module for @storybook/addon-docs/blocks
 *
 * This module re-exports everything from the original @storybook/addon-docs/blocks
 * except CodeOrSourceMdx, which we replace with our Shiki version.
 */

// Import our replacement from the shim file
import { CodeOrSourceMdx as ShikiCodeOrSourceMdx } from '../shims/mdx';

// Import and re-export all exports from the real module
// We do this with a wildcard export first, then override CodeOrSourceMdx
export * from '@storybook/addon-docs/blocks';

// Export our Shiki-powered replacement as CodeOrSourceMdx
export { ShikiCodeOrSourceMdx as CodeOrSourceMdx };
