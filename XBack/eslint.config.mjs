import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
export default [{ ignores: ['node_modules/**', 'dist/**', 'coverage/**'] }, { files: ['src/**/*.ts'], languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: 2020, sourceType: 'module' } }, plugins: { '@typescript-eslint': tsPlugin }, rules: { '@typescript-eslint/no-explicit-any': 'warn', '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] } }];
