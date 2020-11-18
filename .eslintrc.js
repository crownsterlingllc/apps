// Copyright 2017-2020 @polkadot/apps authors & contributors
// SPDX-License-Identifier: Apache-2.0

const base = require('@polkadot/dev/config/eslint.cjs');

// add override for any (a metric ton of them, initial conversion)
module.exports = {
  ...base,
  plugins: [...base.plugins, 'eslint-plugin-import', 'eslint-plugin-import-helpers'],
  ignorePatterns: [
    '.eslintrc.js',
    '.github/**',
    '.vscode/**',
    '.yarn/**',
    '**/build/*',
    '**/coverage/*',
    '**/node_modules/*'
  ],
  parserOptions: {
    ...base.parserOptions,
    project: [
      './tsconfig.json'
    ]
  },
  rules: {
    ...base.rules,
    // needs to be switched on at some point
    '@typescript-eslint/no-explicit-any': 'off',
    // this seems very broken atm, false positives
    '@typescript-eslint/unbound-method': 'off',
    'import-helpers/order-imports': [
      'warn',
      {
        groups: [
          '/^i18next|^@fortawesome\/fontawesome-svg-core/',
          '/^((?!polkadot\/types(.*)).)*\/types.*|^@polkadot\/types\/types|@polkadot\/types\/interfaces|@polkadot\/apps-config\/settings\/endpoints|@polkadot\/types\/primitive\/types$/',
          'module',
          '/^@polkadot/',
          ['parent', 'sibling', 'index'],
          'absolute'
        ]
      },
    ],
  }
};