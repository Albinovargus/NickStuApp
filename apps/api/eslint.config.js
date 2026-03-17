import baseConfig from '@myapp/config/eslint.config.base';

export default [
  ...baseConfig,
  {
    ignores: ['dist/'],
  },
];
