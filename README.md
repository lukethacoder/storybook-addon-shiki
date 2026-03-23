# storybook-addon-shiki

A Storybook addon that replaces Storybook's syntax highlighting with [Shiki](https://shiki.style/) for beautiful, accurate syntax highlighting — with zero changes to your stories.

- 🌐 **Framework-agnostic** — works with React, Vue, Angular, Svelte, or any other Storybook framework.
- 📦 **Fine-grained bundling** — Shiki loads only the languages and themes you need, keeping your bundle lean.
- 🔌 **Drop-in** — uses runtime DOM patching; no fragile module aliasing or bundler hacks.
- 🛡️ **Future-proof** — resilient to Storybook internal changes since it operates at the DOM level.
- 🎨 **Full transformer support** — supports all Shiki transformers (notation highlights, diffs, focus, etc.).
- 🔢 **Line numbers** — full support for line numbers in code blocks.
- 📋 **Copy button** — optional copy-to-clipboard functionality.
- ✅ **Supports Vite and Webpack 5** builders.
- 🎯 **Rich transformers** — Built-in support for diffs, highlights, focus, and more
- 💅 **BYO CSS** — Bring your own styles for the custom transformers (diffs, focusing, highlighting)

## Motivation

This addon directly addresses [storybookjs/storybook#29160](https://github.com/storybookjs/storybook/issues/29160). Storybook's default syntax highlighting relies on Prism.js which contributes significantly to bundle size.

By using a runtime DOM patching approach, this addon is also **future-proof** and won't break when Storybook changes its internal module structure.

---

## Installation

```sh
pnpm add -D @lukethacoder/storybook-addon-shiki shiki
# or
npm install --save-dev @lukethacoder/storybook-addon-shiki shiki
# or
yarn add -D @lukethacoder/storybook-addon-shiki shiki
```

> **Peer dependency:** `shiki >= 1.0.0` is required and must be installed separately. This keeps you in control of the Shiki version.

View on [npm](https://www.npmjs.com/package/@lukethacoder/storybook-addon-shiki)

---

## Setup

Register the addon in `.storybook/main.ts`:

```ts
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite'; // or your framework

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@lukethacoder/storybook-addon-shiki',
  ],
  framework: '@storybook/react-vite',
};

export default config;
```

That's it. Start Storybook and every code block — in the Docs tab, the Source panel, your MDX pages — is now powered by Shiki.

### Shiki Stylesheet

This extensions does not bring its own CSS. You bring your own, you configure it how you like. If you want a drop in "it just works" CSS file, see the [./.storybook/styles.css](./.storybook/styles.css) file.

---

## Configuration

### Themes

By default the addon uses `vitesse-dark`. Pass a `shiki` key when registering the addon to customise:

```ts
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  addons: [
    '@storybook/addon-essentials',
    {
      name: '@lukethacoder/storybook-addon-shiki',
      options: {
        shiki: {
          // any valid shiki theme - `import { type BundledLanguage } from 'shiki'`
          theme: 'one-dark-pro',
          // BYO list of languages that you wish to use
          langs: [
            'jsx',
            'tsx',
            'typescript',
            'javascript',
            'css',
            'html',
            'bash',
            'json',
            'yaml',
            'markdown',
            'graphql',
            'svelte',
          ],
          // requires installing `@shikijs/transformers`
          transformers: {
            // Enable notation-based features (use comments like [!code highlight])
            notationHighlight: true,
            notationDiff: true,
            notationFocus: true,
            notationErrorLevel: true,
            notationWordHighlight: true,
            // Enable meta-based features (use meta strings like {1-3})
            focus: true,
            highlight: true,
            // Enable diff indicators
            diff: true,
            // Enable colorized brackets - requires installing `@shikijs/colorized-brackets`
            colorizedBrackets: true,
          },
        },
      },
    },
  ],
};

export default config;
```

Browse all available themes at [shiki.style/themes](https://shiki.style/themes).

### Pre-loading languages

Shiki loads language grammars on-demand. To ensure specific languages are available immediately and avoid any first-render delay, declare them upfront:

```ts
{
  name: '@lukethacoder/storybook-addon-shiki',
  options: {
    shiki: {
      theme: 'one-dark-pro',
      langs: ['tsx', 'typescript', 'bash', 'json', 'yaml', 'rust', 'python'],
    },
  },
}
```

The following languages are pre-loaded by default: `jsx`, `tsx`, `typescript`, `javascript`, `css`, `html`, `bash`, `json`, `markdown`.

### All options

<!-- keep up to date from `./src/types.ts` -->
```ts
/**
 * Options for configuring the Shiki addon.
 * These can be set in .storybook/main.ts when registering the addon,
 * or overridden per-story via parameters.shiki.
 */
export interface ShikiAddonOptions {
  /**
  * The Shiki theme to use for syntax highlighting.
  * @default 'vitesse-dark'
  */
  theme?: BundledTheme | string;

  /**
  * Languages to pre-load. Shiki loads grammars lazily by default; listing
  * the languages your docs use here avoids any first-render flash.
  *
  * @default Common web languages are loaded automatically.
  */
  langs?: (BundledLanguage | string)[];

  /**
  * Provide your own pre-built Shiki highlighter instance. When supplied the
  * addon will use it as-is and skip its own initialisation. Useful if you
  * already create a highlighter in your Storybook config.
  */
  highlighter?: HighlighterGeneric<BundledLanguage, BundledTheme>;

  /**
  * Configure which Shiki transformers to enable globally.
  * Requires @shikijs/transformers to be installed.
  *
  * @example
  * ```ts
  * transformers: {
  *   focus: true,
  *   highlight: true,
  *   diff: true,
  * }
  * ```
  */
  transformers?: TransformerConfig;
}
```

---

## How it works

This addon uses a **pure runtime approach** with client-side DOM patching — no fragile module aliasing, no bundler hacks. This makes it incredibly resilient to Storybook internal changes.

### Runtime DOM Patching

The addon includes a **runtime patcher** that runs entirely in the browser:

1. **Storybook renders normally** — Code blocks render using Storybook's default Prism syntax highlighting
2. **DOM observer activates** — A `MutationObserver` watches for PrismJS code blocks as they're added to the DOM
3. **Code extraction** — When a Prism block is detected, the addon extracts the raw code text (preserving any transformer notation like `[!code highlight]`)
4. **Shiki re-rendering** — The code is re-highlighted using Shiki with your configured theme and transformers
5. **DOM replacement** — The original Prism element is hidden (`display: none`) and the Shiki version is inserted as a sibling
6. **Content watching** — The addon continues to watch the hidden Prism elements for content changes and automatically regenerates Shiki output when needed
7. **Cleanup** — When Prism elements are removed from the DOM, their corresponding Shiki versions are cleaned up automatically

This approach ensures comprehensive coverage:
- ✅ **Docs tab** "Show code" blocks
- ✅ **MDX code blocks** (` ```jsx `)
- ✅ **Source panel** (`<Source />` blocks)
- ✅ **Controls panel** (argTypes with control descriptions)
- ✅ **Code Panel** (in the manager context)
- ✅ **Autodocs** (auto-generated documentation)
- ✅ **Dynamic content** stays in sync as stories change

### Why Runtime Patching?

Previous approaches relied on bundler-level module aliasing (proxying `@storybook/addon-docs/blocks`, etc.) which was:
- ❌ Fragile and broke with Storybook internal changes
- ❌ Complex to maintain across different bundler configurations
- ❌ Difficult to debug when issues occurred

Runtime patching is:
- ✅ **Resilient** — Works regardless of how Storybook's internals change
- ✅ **Simple** — One clear interception point in the DOM
- ✅ **Universal** — Works with any bundler (Vite, Webpack, etc.)
- ✅ **Debuggable** — All logic is in one place and runs in the browser

### Configuration Sharing

Addon options configured in `main.ts` are made available to both preview and manager contexts:

- **Preview context**: Via a **virtual module** (`@lukethacoder/storybook-addon-shiki/options`) generated by the preset's `viteFinal`/`webpackFinal` hooks
- **Manager context**: Via a **global variable** (`window.__STORYBOOK_ADDON_SHIKI_OPTIONS__`) injected through the `managerHead` hook

This ensures consistent theming and configuration across all code blocks, regardless of where they render.

---

## Building from source / contributing

```sh
git clone https://github.com/lukethacoder/storybook-addon-shiki
cd storybook-addon-shiki

# install packages
pnpm install

# compile with tsup
pnpm build

# start the dev Storybook (uses the addon on itself)
pnpm storybook 
```

## Publishing NPM Package

Manual package updating

```sh
pnpm whoami

pnpm login

pnpm publish --access public # add --tag TAG_NAME if required
```

---

## Compatibility

| Storybook  | Builder   | Status |
| ---------- | --------- | ------ |
| 8.x        | Vite      | ❓     |
| 8.x        | Webpack 5 | ❓     |
| 9.x / 10.x | Vite      | ✅     |
| 9.x / 10.x | Webpack 5 | ✅     |

---

## License

MIT
