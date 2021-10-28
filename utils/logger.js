/* eslint no-console: ["error", {allow: ["log"]}] */

const info = (...params) => {
  if (process.env.NODE_ENV !== "test") console.log(...params);
};

module.exports = { info };
