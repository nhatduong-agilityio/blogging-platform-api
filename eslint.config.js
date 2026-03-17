// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default tseslint.config(
  // Base recommended rules
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // Prettier integration (disables conflicting rules + enables prettier/prettier rule)
  prettierConfig,

  {
    plugins: {
      prettier: prettierPlugin
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }]
    }
  },

  // Relaxed rules for __tests__/ — test code has different patterns:
  //   - jest.unstable_mockModule requires (jest as any) until Jest v30
  //     types the API fully
  //   - as unknown as SomeType is common for building mock objects
  //   - explicit return types on test helpers are noisy, not valuable
  //   - console.log is useful for debugging failing tests
  {
    files: ['**/__tests__/**/*.ts', '**/e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': 'off'
    }
  },

  // Ignore built output and config files themselves
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'eslint.config.js',
      'commitlint.config.js',
      'coverage'
    ]
  }
);
