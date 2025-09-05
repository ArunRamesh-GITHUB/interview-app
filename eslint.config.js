import js from '@eslint/js';
import security from 'eslint-plugin-security';

export default [
  js.configs.recommended,
  {
    plugins: {
      security,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        setImmediate: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        File: 'readonly',
      },
    },
    rules: {
      // Security rules
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-new-buffer': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',
      
      // Code quality rules
      'no-console': 'off', // Allow console logs for server
      'no-unused-vars': 'error',
      'no-undef': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': 'error',
      'curly': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-proto': 'error',
      'no-iterator': 'error',
      'no-extend-native': 'error',
      'no-implicit-globals': 'error',
      'no-new-wrappers': 'error',
      'no-octal-escape': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-void': 'error',
      'wrap-iife': 'error',
      'yoda': 'error',
    },
  },
  {
    files: ['**/*.js'],
    rules: {
      // Additional rules for .js files
      'no-magic-numbers': ['warn', { 
        ignore: [-1, 0, 1, 2, 3, 5, 10, 15, 20, 24, 30, 40, 50, 55, 60, 70, 85, 100, 120, 150, 200, 250, 300, 400, 401, 403, 404, 429, 500, 800, 1000, 1024, 1200, 3000, 30000], 
        ignoreArrayIndexes: true 
      }],
    },
  },
  {
    ignores: [
      'node_modules/**',
      'web/**',
      'mobile-shell/**',
      'public/**',
      'dist/**',
      'cache_tts/**',
      '*.min.js',
    ],
  },
];