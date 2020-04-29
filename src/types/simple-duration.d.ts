declare module "simple-duration" {
  /**
   * Parses a string using the Simple Duration Format and returns the number of seconds corresponding to it.
   */
  export function parse(str: string): number;

  /**
   * Formats a number of seconds. The rounding is using the milliseconds as default value but you can pass any other unit as defined below.
   * @param seconds - The number of seconds.
   * @param rounding - Rounding units.
   *
   * @remarks
   * Here are the possible rounding units:
   *
   * - `y` - A Julian year, which means 365.25 days.
   * - `d` - 24 hours.
   * - `h` - 60 minutes.
   * - `m` - 60 seconds.
   * - `s` - A second according to the SI.
   * - `ms` - 10e-3 seconds.
   * - `µs` - 10e-6 seconds.
   * - `ns` - 10e-9 seconds.
   *
   * You can specify any number of units in any order. As example `24s 3h` is perfectly valid. You can also specify negative amounts of time like `-3m`.
   *
   * When formatting, the `stringify` function will always use a normalizing process.
   */
  export function stringify(seconds: number, rounding = "ms"): string;
}
