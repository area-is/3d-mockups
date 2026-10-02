/**
 * Every size a caller passes in millimetres goes through here before it
 * becomes geometry.
 *
 * A bad size used not to fail on its own. A missing `size` on the two kinds
 * that require one threw a TypeError naming neither the prop nor the mockup,
 * and took the whole React tree down with it; a zero, a negative or a NaN
 * divided its way into an Infinity scale, a negative rectangle or a NaN that
 * every number downstream inherited - the mockup rendered as nothing and
 * `mockupInfo` reported Infinity, with no error at all. Each spec builder
 * checks its size here instead, so the mistake is named where it is made, for
 * the component and `mockupInfo` alike.
 *
 * @param what     the component, as the message names it (`'CustomPanel'`)
 * @param example  a valid size for the message, as it would be written in JSX
 */
export function checkSizeMm<T extends object>(what: string, size: T | undefined | null, example: string): T {
  if (size === undefined || size === null) {
    throw new Error(`[react-3d-mockups] ${what} requires a \`size\` in millimetres, e.g. size={{ ${example} }}.`)
  }
  for (const [key, value] of Object.entries(size)) {
    if (value !== undefined && !(typeof value === 'number' && Number.isFinite(value) && value > 0)) {
      throw new Error(
        `[react-3d-mockups] ${what}: size.${key} is ${String(value)}, and every dimension must be a positive ` +
          `number of millimetres, e.g. size={{ ${example} }}.`
      )
    }
  }
  return size
}
