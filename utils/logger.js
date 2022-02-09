/* eslint no-console: ["error", {allow: ["log", "info"]}] */

const info = (...params) => {
  if (process.env.NODE_ENV !== "test") console.log(...params);
  if (process.env.NODE_ENV === "test") console.info(...params);
};

module.exports = { info };
