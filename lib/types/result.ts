export type Result<T, E extends { code: string }> =
  | readonly [error: E, value: null]
  | readonly [error: null, value: T];
