module.exports = {
  root: true,
  extends: ['next', 'next/core-web-vitals', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: { tsconfigRootDir: __dirname, project: ['./tsconfig.eslint.json'] },
  rules: {
    'prefer-const': 'warn',
    '@typescript-eslint/no-empty-object-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-console': 'warn'
  },
  overrides: [
    { files: ['src/app/api/**/*'], rules: { '@typescript-eslint/no-explicit-any': 'off', 'no-console': 'off' } }
  ]
};
