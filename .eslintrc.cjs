module.exports = {
  root: true,
  extends: [
    'next',
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.eslint.json']
  },
  rules: {
    // Giữ cảnh báo, không chặn CI
    'prefer-const': 'warn',
    'no-console': 'warn',
    '@typescript-eslint/no-empty-object-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
    ],
    // Không cho lint fail build
    'no-unused-vars': 'off'
  },
  overrides: [
    {
      files: ['src/app/api/**/*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off'
      }
    },
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
        '@typescript-eslint/no-unused-vars': 'off'
      }
    }
  ],
  ignorePatterns: [
    '.next/',
    'dist/',
    'coverage/',
    'node_modules/',
    '**/*.gen.ts',
    '**/generated/**'
  ]
};
