module.exports = {
  "env": {
    "commonjs": true,
    "es2021": true,
    "node": true,
    "jest": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "plugins": ["@typescript-eslint"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "project": "./tsconfig.json"
  },
  "rules": {
    "no-unused-vars": "off",
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
    "no-case-declarations": "error",

    "eol-last": ["error", "always"],
    "indent": ["error", 2, { "SwitchCase": 1 }],
    "object-curly-spacing": ["error", "always"],
    "quotes": ["error", "double"],
    "space-in-parens": ["error", "never"],
    "spaced-comment": ["error", "always"],
    "no-shadow": ["error", { "builtinGlobals": false}],

    "space-before-function-paren": ["error", {
        "anonymous": "never",
        "named": "never",
        "asyncArrow": "never"
    }],
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


    "@typescript-eslint/semi": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/explicit-module-boundary-types": "error",
    "@typescript-eslint/restrict-plus-operands": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-argument": "error",
    "@typescript-eslint/no-unsafe-return": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-call": "error"
  }
};
