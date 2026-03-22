/**
 * Transformers module - dynamically loads Shiki transformers based on configuration
 *
 * This module conditionally imports @shikijs/transformers if it's installed,
 * and provides a function to load transformers based on the addon configuration.
 */

import type { ShikiTransformer } from 'shiki';
import type { TransformerConfig } from './types';

/**
 * Check if @shikijs/transformers is available
 */
async function hasTransformersPackage(): Promise<boolean> {
  try {
    await import('@shikijs/transformers');
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if @shikijs/colorized-brackets is available
 */
async function hasColorizedBracketsPackage(): Promise<boolean> {
  try {
    await import('@shikijs/colorized-brackets');
    return true;
  } catch {
    return false;
  }
}

/**
 * Load transformers based on the provided configuration.
 * Returns an array of Shiki transformers that are enabled in the config.
 *
 * If required packages are not installed, this function logs warnings for
 * the specific transformers that cannot be loaded.
 *
 * @param config - Transformer configuration object
 * @returns Array of enabled Shiki transformers
 */
export async function loadTransformers(config?: TransformerConfig): Promise<ShikiTransformer[]> {
  // If no config provided or all values are falsy, return empty array
  if (!config || !Object.values(config).some(Boolean)) {
    return [];
  }

  const result: ShikiTransformer[] = [];

  // Separate colorizedBrackets from other transformers as it's in a separate package
  const { colorizedBrackets, ...standardTransformers } = config;

  // Handle standard transformers from @shikijs/transformers
  const hasStandardTransformers = Object.values(standardTransformers).some(Boolean);
  if (hasStandardTransformers) {
    const hasPackage = await hasTransformersPackage();
    if (!hasPackage) {
      const enabledTransformers = Object.entries(standardTransformers)
        .filter(([, enabled]) => enabled)
        .map(([name]) => name);

      if (enabledTransformers.length > 0) {
        console.warn(
          `[@lukethacoder/storybook-addon-shiki] Transformers requested (${enabledTransformers.join(', ')}) but @shikijs/transformers is not installed. ` +
            'Install it with: npm install -D @shikijs/transformers',
        );
      }
    } else {
      // Dynamically import transformers package
      const transformers = await import('@shikijs/transformers');

      // Load transformers based on config
      if (config.focus) {
        result.push(transformers.transformerMetaHighlight());
      }

      if (config.highlight) {
        result.push(transformers.transformerMetaHighlight());
      }

      if (config.diff) {
        result.push(transformers.transformerNotationDiff());
      }

      if (config.notationHighlight) {
        result.push(transformers.transformerNotationHighlight());
      }

      if (config.notationDiff) {
        result.push(transformers.transformerNotationDiff());
      }

      if (config.notationFocus) {
        result.push(transformers.transformerNotationFocus());
      }

      if (config.notationErrorLevel) {
        result.push(transformers.transformerNotationErrorLevel());
      }

      if (config.notationWordHighlight) {
        result.push(transformers.transformerNotationWordHighlight());
      }

      if (config.compactLineOptions) {
        result.push(transformers.transformerCompactLineOptions());
      }

      if (config.removeLineRemove) {
        result.push(transformers.transformerRemoveNotationEscape());
      }
    }
  }

  // Handle colorizedBrackets separately from @shikijs/colorized-brackets
  if (colorizedBrackets) {
    const hasBracketsPackage = await hasColorizedBracketsPackage();
    if (!hasBracketsPackage) {
      console.warn(
        '[@lukethacoder/storybook-addon-shiki] colorizedBrackets transformer requested but @shikijs/colorized-brackets is not installed. ' +
          'Install it with: npm install -D @shikijs/colorized-brackets',
      );
    } else {
      const { transformerColorizedBrackets } = await import('@shikijs/colorized-brackets');
      result.push(transformerColorizedBrackets());
    }
  }

  return result;
}
