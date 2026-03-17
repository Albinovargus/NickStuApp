import baseConfig, { createSupabaseBan } from '@myapp/config/eslint.config.base';

export default [
  ...baseConfig,
  createSupabaseBan(),
  {
    ignores: ['dist/', 'ios/', 'android/'],
  },
  {
    files: ['src/lib/supabase.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
];
