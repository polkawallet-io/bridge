
// Copyright 2017-2021 @polkadot/apps authors & contributors
// SPDX-License-Identifier: Apache-2.0

const base = require('@open-web3/dev-config/config/eslint.cjs');

// add override for any (a metric ton of them, initial conversion)
module.exports = {
  ...base,
  ignorePatterns: [
    '.eslintrc.js',
    '.github/**',
    '.vscode/**',
    '.yarn/**',
    '**/build/*',
    '**/coverage/*',
    '**/node_modules/*'
  ],
  plugins: [
    ...base.plugins,
    "unused-imports"
  ],
  parserOptions: {
    ...base.parserOptions,
    project: [
      './tsconfig.json'
    ]
  },
  rules: {
    ...base.rules,
    '@typescript-eslint/no-explicit-any': 'off',
    'react/prop-types': 'off',
    'header/header': 'off',
    // TODO This is a new error on latest eslint version, if possible fix all 223 places where 'any' is used as function argument
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'react/jsx-no-bind': 'off',
    'react/jsx-max-props-per-line': 'off',
    '@typescript-eslint/unbound-method': 'off',
    'react/jsx-closing-bracket-location': 'off',
    'sort-keys': 'off',
    'react/jsx-no-bind': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "error",
      { "vars": "all", "varsIgnorePattern": "^_", "args": "after-used", "argsIgnorePattern": "^_" }
    ]
  }
};
