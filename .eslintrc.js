// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM — .eslintrc.js
// ============================================

module.exports = {
  root: true,

  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true,
  },

  parser: '@babel/eslint-parser',

  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    requireConfigFile: false,
    babelOptions: {
      presets: ['@babel/preset-react'],
    },
  },

  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'prettier',
  ],

  plugins: ['react', 'react-hooks', 'jsx-a11y', 'import', 'prettier'],

  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        paths: ['src'],
      },
    },
  },

  rules: {
    // ─── Prettier ─────────────────────────
    'prettier/prettier': [
      'error',
      {
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
        printWidth: 100,
        tabWidth: 2,
        useTabs: false,
        endOfLine: 'lf',
      },
    ],

    // ─── General JS ───────────────────────
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    'no-duplicate-imports': 'error',
    'no-shadow': 'warn',
    'no-nested-ternary': 'warn',
    'no-unneeded-ternary': 'warn',
    'no-return-await': 'error',
    'no-throw-literal': 'error',
    'no-param-reassign': [
      'warn',
      {
        props: true,
        ignorePropertyModificationsFor: [
          'acc',
          'accumulator',
          'e',
          'ctx',
          'req',
          'request',
          'res',
          'response',
          'state',
        ],
      },
    ],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    curly: ['error', 'all'],
    'dot-notation': 'error',
    'object-shorthand': 'error',
    'arrow-body-style': ['warn', 'as-needed'],

    // ─── React ────────────────────────────
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'react/self-closing-comp': 'error',
    'react/jsx-boolean-value': ['error', 'never'],
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    'react/jsx-no-useless-fragment': 'warn',
    'react/jsx-pascal-case': 'error',
    'react/no-array-index-key': 'warn',
    'react/no-danger': 'warn',
    'react/no-unstable-nested-components': 'error',

    // ─── React Hooks ──────────────────────
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // ─── Imports ──────────────────────────
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-duplicates': 'error',
    'import/no-unused-modules': 'warn',
    'import/first': 'error',
    'import/newline-after-import': 'error',

    // ─── Accessibility ────────────────────
    'jsx-a11y/anchor-is-valid': [
      'warn',
      {
        components: ['Link'],
        specialLink: ['to'],
      },
    ],
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
  },

  // ─── Override Rules Per File Type ─────────
  overrides: [
    // Backend Node.js files — no React rules
    {
      files: ['server/**/*.js'],
      env: {
        browser: false,
        node: true,
      },
      rules: {
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        'jsx-a11y/anchor-is-valid': 'off',
        'import/no-unused-modules': 'off',
      },
    },
    // Seed files — allow console.log
    {
      files: ['server/src/seed/**/*.js'],
      rules: {
        'no-console': 'off',
      },
    },
    // Config files — allow require()
    {
      files: [
        '*.config.js',
        '.eslintrc.js',
        'tailwind.config.js',
        'postcss.config.js',
        'vite.config.js',
      ],
      rules: {
        'import/no-commonjs': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    // Test files
    {
      files: ['**/*.test.js', '**/*.spec.js', '**/*.test.jsx'],
      env: {
        jest: true,
      },
      rules: {
        'no-unused-expressions': 'off',
      },
    },
  ],

  // ─── Files to Ignore ──────────────────────
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'client/dist/',
    'server/uploads/',
    '*.min.js',
    'coverage/',
    '.prettierrc.js',
  ],
};
