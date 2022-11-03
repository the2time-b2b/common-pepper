/* eslint no-console: ["error", {allow: ["log", "info"]}] */

export function info(...params: Array<string>): void {
  if (process.env.NODE_ENV !== "test") console.log(...params);
  if (process.env.NODE_ENV === "test") console.info(...params);
}
