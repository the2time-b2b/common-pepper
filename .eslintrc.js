module.exports = {
  "env": {
    "commonjs": true,
    "es2021": true,
    "node": true,
    "jest": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": "latest"
  },
  "rules": {
    "block-spacing": "error",
    "consistent-return": "error",
    "camelcase": "error",
    "capitalized-comments": "error",
    "eqeqeq": "error",
    "max-len": "error",
    "no-debugger": "error",
    "no-multi-spaces": "error",
    "no-duplicate-imports": "error",
    "no-self-compare": "error",
    "no-template-curly-in-string": "error",
    "no-unreachable-loop": "error",
    "no-trailing-spaces": "error",
    "no-else-return": "error",
    "no-empty-function": "error",
    "no-lone-blocks": "error",
    "no-var": "error",
    "prefer-const": "error",
    "space-before-blocks": "error",

    "eol-last": ["error", "always"],
    "indent": ["error", 2],
    "linebreak-style": ["error", "windows"],
    "object-curly-spacing": ["error", "always"],
    "quotes": ["error", "double"],
    "semi": ["error", "always"],
    "space-in-parens": ["error", "never"],
    "space-before-function-paren": ["error", "never"],
    "spaced-comment": ["error", "always"],

    "arrow-spacing": [
      "error",
      { "before": true, "after": true }
    ],
    "key-spacing": [
      "error",
      { "beforeColon": false }
    ],
    "no-console": [
      "error",
      { "allow": ["warn", "error", "info"] }
    ],
  }
};
