/**
 * Manager entry point
 *
 * This loads the runtime patcher in the manager context to handle
 * the Code Panel addon, which renders outside the preview iframe.
 */

// Import runtime patcher (it will initialize automatically)
import './runtime-patcher';

// Export a register function that Storybook will call
// This gives us access to the Storybook API where we can get parameters
export function register() {
  // This is intentionally empty - we just need the manager.ts to load
  // The runtime patcher will handle everything automatically
}
