import tseslint from 'typescript-eslint';

/**
 * Creates an ESLint rule that bans @supabase/supabase-js imports
 * in apps/web except from src/lib/supabase.ts (auth UI only).
 */
export function createSupabaseBan() {
  return {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@supabase/supabase-js',
              message:
                'Import from src/lib/supabase.ts instead. Direct Supabase imports are banned in the frontend — the proxy boundary is inviolable.',
            },
          ],
        },
      ],
    },
  };
}

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
);
