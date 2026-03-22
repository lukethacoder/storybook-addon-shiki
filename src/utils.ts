/**
 * Creates a promise that resolves after a specified time interval
 *
 * @param interval - time to wait in milliseconds (default: 0)
 * @returns promise that resolves after the specified interval
 *
 * @example
 * ```ts
 * await timeout(1000); // wait for 1 second
 * ```
 */
export function timeout(interval: number = 0): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, interval);
  });
}

/**
 * Object utility methods
 */
export const Obj = {
  /**
   * Check if an object has no own enumerable properties
   *
   * @param obj - The object to check
   * @returns `true` if the object has no own properties, `false` otherwise
   *
   * @example
   * ```ts
   * Obj.isEmpty({}); // true
   * Obj.isEmpty({ key: 'value' }); // false
   * ```
   */
  isEmpty(obj: object): boolean {
    return Object.keys(obj).length === 0;
  },
};
