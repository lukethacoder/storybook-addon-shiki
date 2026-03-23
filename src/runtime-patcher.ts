/**
 * Runtime patcher for PrismJS code blocks
 *
 * This patches PrismJS-rendered code blocks in the DOM after they render,
 * replacing them with Shiki-highlighted versions. It's a "hacky" browser-based
 * approach that works by:
 * 1. Finding <pre><code> blocks that Prism has already rendered
 * 2. Extracting the code and language from them
 * 3. Re-highlighting with Shiki
 * 4. Replacing the Prism content with Shiki HTML
 */

import { getHighlighter } from './highlighter';
import type { ShikiAddonOptions } from './types';
import { Obj } from './utils';
import { loadTransformers } from './transformers';

// TypeScript global augmentation
declare global {
  interface Window {
    __STORYBOOK_ADDON_SHIKI_INITIALIZED__?: boolean;
    __STORYBOOK_ADDON_SHIKI_OPTIONS__?: ShikiAddonOptions;
  }
}

// Guard against double initialization (can happen with Svelte or other frameworks)
const isAlreadyInitialized = typeof window !== 'undefined' && window.__STORYBOOK_ADDON_SHIKI_INITIALIZED__;

if (isAlreadyInitialized) {
  console.warn(
    '[@lukethacoder/storybook-addon-shiki] Runtime patcher already initialized. Skipping duplicate initialization. ' +
      'This usually means the addon preview annotations are being loaded multiple times.',
  );
}

if (typeof window !== 'undefined' && !isAlreadyInitialized) {
  window.__STORYBOOK_ADDON_SHIKI_INITIALIZED__ = true;
}

// Track which elements we've already patched to avoid re-processing
const patchedElements = new WeakSet<HTMLElement>();

// Map original Prism elements to their Shiki replacements
const prismToShikiMap = new WeakMap<HTMLElement, HTMLElement>();

// Cache for the Shiki options
let cachedOptions: ShikiAddonOptions = {};

/**
 * Load options from multiple sources (manager global, virtual module, or defaults)
 */
async function getOptions(): Promise<ShikiAddonOptions> {
  if (!Obj.isEmpty(cachedOptions)) return cachedOptions;

  // Check for global options (set by managerHead in manager context)
  if (typeof window !== 'undefined' && window.__STORYBOOK_ADDON_SHIKI_OPTIONS__) {
    cachedOptions = window.__STORYBOOK_ADDON_SHIKI_OPTIONS__;
    return cachedOptions;
  }

  // Fall back to virtual module (preview context)
  try {
    const { shikiOptions } = await import('@lukethacoder/storybook-addon-shiki/options');
    cachedOptions = shikiOptions || {};
    return cachedOptions;
  } catch (err) {
    console.warn('[@lukethacoder/storybook-addon-shiki] Could not load options:', err);
    return {};
  }
}

/**
 * Extract language from class names like "language-javascript" or "lang-js"
 */
function extractLanguage(element: HTMLElement): string {
  const classes = element.className.split(' ');

  for (const cls of classes) {
    if (cls.startsWith('language-')) {
      return cls.replace('language-', '');
    }
    if (cls.startsWith('lang-')) {
      return cls.replace('lang-', '');
    }
  }

  return 'plaintext';
}

/**
 * Check if an element is a PrismJS code block wrapper
 * We only want to patch <pre> wrappers, not the inner code elements
 * PrismJS typically renders as:
 * - <pre class="..."><code class="language-xxx">...</code></pre> (docs/MDX)
 * - <pre class="prismjs"><div class="language-xxx">...</div></pre> (Code Panel)
 */
function isPrismCodeBlock(element: HTMLElement): boolean {
  // Only process <pre> wrappers
  if (element.tagName !== 'PRE') {
    return false;
  }

  // Check if it contains a code/div with language class
  const code = element.querySelector('[class*="language-"]');
  return code !== null;
}

/**
 * Wait for textContent to exist in an element with a timeout
 */
async function waitForTextContent(element: HTMLElement, timeoutMs = 2000): Promise<string | null> {
  const startTime = Date.now();
  const pollInterval = 50; // Check every 50ms

  return new Promise((resolve) => {
    const checkContent = () => {
      const content = element.textContent?.trim();

      if (content) {
        resolve(content);
        return;
      }

      // Check if we've exceeded the timeout
      if (Date.now() - startTime >= timeoutMs) {
        console.warn(
          `[@lukethacoder/storybook-addon-shiki] No textContent found in code element after ${timeoutMs / 1000} seconds`,
          element,
        );
        resolve(null);
        return;
      }

      // Continue polling
      setTimeout(checkContent, pollInterval);
    };

    checkContent();
  });
}

/**
 * Generate Shiki HTML for a code element
 */
async function generateShikiHtml(codeElement: HTMLElement): Promise<HTMLElement | null> {
  const code = codeElement.textContent?.trim();
  if (!code) return null;

  const language = extractLanguage(codeElement);
  const options = await getOptions();
  const theme = options.theme ?? 'vitesse-dark';
  const highlighter = await getHighlighter(options);

  // Load transformers based on config
  const transformers = await loadTransformers(options.transformers);

  const html = highlighter.codeToHtml(code, {
    lang: language,
    theme: theme as never,
    transformers,
  });

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const shikiPre = tempDiv.querySelector('pre');

  return shikiPre;
}

/**
 * Update an existing Shiki element with new content from the original Prism element
 */
async function updateShikiElement(originalElement: HTMLElement) {
  try {
    // Check if the original element still exists in the DOM
    if (!originalElement.isConnected) {
      return;
    }

    const codeElement: HTMLElement | null = originalElement.querySelector('[class*="language-"]');
    if (!codeElement) return;

    const code = codeElement.textContent?.trim();
    if (!code) return;

    const newShikiPre = await generateShikiHtml(codeElement);
    if (!newShikiPre) return;

    const oldShikiElement = prismToShikiMap.get(originalElement);
    if (!oldShikiElement || !oldShikiElement.parentNode) return;

    // Copy classes from old Shiki element
    newShikiPre.className = oldShikiElement.className;
    newShikiPre.setAttribute('data-shiki-patched', 'true');

    // Replace the old Shiki element
    oldShikiElement.parentNode.replaceChild(newShikiPre, oldShikiElement);

    // Update the map
    prismToShikiMap.set(originalElement, newShikiPre);
  } catch (err) {
    console.error('[@lukethacoder/storybook-addon-shiki] Error updating Shiki element:', err);
  }
}

/**
 * Clean up a Shiki element when its original Prism element is removed
 */
function cleanupShikiElement(originalElement: HTMLElement) {
  const shikiElement = prismToShikiMap.get(originalElement);
  if (shikiElement && shikiElement.parentNode) {
    shikiElement.parentNode.removeChild(shikiElement);
    prismToShikiMap.delete(originalElement);
  }
}

/**
 * Patch a PrismJS code block by hiding it and inserting a Shiki version
 */
async function patchCodeBlock(element: HTMLElement) {
  // Prevent re-patching the same element
  if (patchedElements.has(element)) {
    return;
  }

  patchedElements.add(element);

  try {
    // Element should always be a <pre> at this point
    // Find the inner code/div element with language class
    const codeElement: HTMLElement | null = element.querySelector('[class*="language-"]');

    if (!codeElement) {
      console.warn('[@lukethacoder/storybook-addon-shiki] No code element found');
      return;
    }

    // wait for textContent to exist (default 2s timeout)
    const code = await waitForTextContent(codeElement);
    if (!code) {
      // skip if no content after timeout
      return;
    }

    const shikiPre = await generateShikiHtml(codeElement);
    if (!shikiPre) {
      console.warn('[@lukethacoder/storybook-addon-shiki] No <pre> in Shiki output');
      return;
    }

    // element is the <pre> wrapper
    if (element.parentNode) {
      // Copy over any important classes/attributes from original
      const originalClasses = element.className
        .split(' ')
        .filter((cls) => !cls.startsWith('language-') && !cls.startsWith('lang-'));

      if (originalClasses.length > 0) {
        shikiPre.className = `${shikiPre.className} ${originalClasses.join(' ')}`;
      }

      // Mark as patched
      shikiPre.setAttribute('data-shiki-patched', 'true');

      // Hide the original Prism element instead of removing it
      // commented out for testing - remove before publishing
      element.style.display = 'none';
      element.setAttribute('data-shiki-original', 'true');

      // Insert Shiki element after the original
      element.parentNode.insertBefore(shikiPre, element.nextSibling);

      // Store the mapping for cleanup later
      prismToShikiMap.set(element, shikiPre);

      // Set up observer to watch for content changes in the original Prism element
      const contentObserver = new MutationObserver(() => {
        updateShikiElement(element);
      });

      contentObserver.observe(element, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
  } catch (err) {
    console.error('[@lukethacoder/storybook-addon-shiki] Error patching code block:', err);
  }
}

/**
 * Scan the document for PrismJS code blocks and patch them
 */
async function scanAndPatch(root: Document | HTMLElement = document) {
  // Only look for <pre> wrappers, not the inner code/div elements
  // Skip elements that are already patched (original or Shiki version)
  const candidates = root.querySelectorAll<HTMLElement>('pre:not([data-shiki-patched]):not([data-shiki-original])');

  for (const candidate of Array.from(candidates)) {
    if (isPrismCodeBlock(candidate) && !patchedElements.has(candidate)) {
      await patchCodeBlock(candidate);
    }
  }
}

/**
 * Set up a MutationObserver to catch dynamically added/removed code blocks
 */
function observeDOM() {
  const observer = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      // Check removed nodes - clean up orphaned Shiki elements
      for (const node of Array.from(mutation.removedNodes)) {
        if (node instanceof HTMLElement) {
          // If this node is a Prism original, clean up its Shiki counterpart
          if (node.hasAttribute('data-shiki-original')) {
            cleanupShikiElement(node);
            patchedElements.delete(node);
          }

          // Check if any descendants were Prism originals
          const removedOriginals = node.querySelectorAll<HTMLElement>('[data-shiki-original]');
          for (const original of Array.from(removedOriginals)) {
            cleanupShikiElement(original);
            patchedElements.delete(original);
          }
        }
      }

      // Check added nodes
      for (const node of Array.from(mutation.addedNodes)) {
        if (node instanceof HTMLElement) {
          // Check if the node itself is a code block wrapper
          if (isPrismCodeBlock(node) && !patchedElements.has(node)) {
            patchCodeBlock(node);
          }

          // Check descendants (only look for <pre> wrappers)
          const descendants = node.querySelectorAll<HTMLElement>(
            'pre:not([data-shiki-patched]):not([data-shiki-original])',
          );

          for (const descendant of Array.from(descendants)) {
            if (isPrismCodeBlock(descendant) && !patchedElements.has(descendant)) {
              patchCodeBlock(descendant);
            }
          }
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return observer;
}

/**
 * Initialize the runtime patcher
 */
function init() {
  // Initial scan after a short delay to let Storybook/Prism render
  setTimeout(() => {
    scanAndPatch();
  }, 100);

  // Additional scan after a longer delay (for slow-loading stories)
  setTimeout(() => {
    scanAndPatch();
  }, 1000);

  // Set up observer for dynamic content
  observeDOM();
}

// Initialize when DOM is ready (only if not already initialized)
if (!isAlreadyInitialized) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

// Export for manual triggering if needed
export { scanAndPatch, patchCodeBlock };
