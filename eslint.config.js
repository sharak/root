import globals from 'globals'
import path from 'path'
import { fileURLToPath } from 'url'
import eslintConfigPrettier from 'eslint-plugin-prettier/recommended'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})
export default [
  {
    files: ['**/*.mjs', '**/*.js'],
  },
  ...compat.extends('standard', 'plugin:foundry-vtt/recommended'),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        DocumentSheetConfig: 'readonly',
        foundry: 'readonly',
        ActiveEffect: 'readonly',
        ActiveEffectConfig: 'readonly',
        randomID: 'readonly',
        getDocumentClass: 'readonly',
        TokenDocument: 'readonly',
        TextEditor: 'readonly',
      },

      ecmaVersion: 'latest',
      sourceType: 'module',
    },

    rules: {
      camelcase: 'off',
    },
  },
  eslintConfigPrettier,
]
