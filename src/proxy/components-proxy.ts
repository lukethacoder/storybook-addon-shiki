/**
 * Proxy module for storybook/internal/components
 *
 * This module re-exports everything from the original storybook/internal/components
 * except SyntaxHighlighter, Code, ClipboardCode, and Pre which we replace with our Shiki version.
 */

// Import our replacement from the shim file
import { SyntaxHighlighter as ShikiSyntaxHighlighter } from '../shims/storybook-syntax-highlighter';

// Re-export everything from the original module
// This will include all exports like PopoverProvider, Tooltip, etc.
export * from 'storybook/internal/components';

// Override the syntax highlighting components with our Shiki-powered versions
export { ShikiSyntaxHighlighter as SyntaxHighlighter };
