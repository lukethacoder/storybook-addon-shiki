# storybook-addon-shiki

A Storybook addon that replaces Storybook's internal syntax highlighting components with [Shiki](https://shiki.style/) for beautiful, accurate syntax highlighting — with zero changes to your stories.

- 🌐 **Framework-agnostic** — works with React, Vue, Angular, Svelte, or any other Storybook framework.
- 📦 **Fine-grained bundling** — Shiki loads only the languages and themes you need, keeping your bundle lean.
- 🔌 **Drop-in** — intercepts Storybook's internal components at the bundler level; no code changes required.
- 🔢 **Line numbers** — full support for line numbers in code blocks.
- 📋 **Copy button** — optional copy-to-clipboard functionality.
- ✅ **Supports Vite and Webpack 5** builders.

## Motivation

This addon directly addresses [storybookjs/storybook#29160](https://github.com/storybookjs/storybook/issues/29160). Storybook's default syntax highlighting relies on Prism.js which contributes significantly to bundle size. Shiki offers fine-grained language/theme loading, better highlighting quality through VS Code's grammar engine, and a modern async API.

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
    // Add this line — it must come after addon-essentials so it can
    // override the SyntaxHighlighter that addon-docs registers.
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

This addon uses a **hybrid approach** combining bundler-level interception with runtime DOM patching to ensure comprehensive Shiki coverage across all Storybook contexts.

### Bundler-level interception

The addon uses **proxy modules** that re-export everything from Storybook's internals except the syntax highlighting components, which are replaced with Shiki-powered versions:

| Storybook Module                | Intercepted Components                |
| ------------------------------- | ------------------------------------- |
| `storybook/internal/components` | `SyntaxHighlighter`                   |
| `@storybook/addon-docs/blocks`  | `CodeOrSourceMdx` (used in MDX files) |

When Storybook or any of its addons import these components, they automatically get the addon's Shiki replacements instead.

### Runtime DOM patching

For contexts where bundler interception isn't sufficient (like the Code Panel and autodocs), the addon includes a **runtime patcher** that:

1. **Observes the DOM** using `MutationObserver` to detect PrismJS code blocks as they're added
2. **Hides the original** Prism elements with `display: none` (keeping them in the DOM)
3. **Inserts Shiki versions** as siblings to the hidden Prism blocks
4. **Watches for content changes** on the hidden Prism elements and automatically regenerates Shiki output
5. **Cleans up** orphaned Shiki blocks when their corresponding Prism elements are removed

This approach ensures:
- ✅ **Docs tab** "Show code" blocks use Shiki (bundler interception)
- ✅ **MDX code blocks** (` ```jsx `) use Shiki (bundler interception)
- ✅ **Code Panel** uses Shiki (runtime patcher in manager context)
- ✅ **Autodocs** use Shiki (runtime patcher in preview context)
- ✅ **Dynamic content** stays in sync as stories change (content watching)

### Configuration sharing

Addon options configured in `main.ts` are made available to both contexts:

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
