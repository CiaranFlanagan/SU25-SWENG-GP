/* eslint import/no-extraneous-dependencies: "off" */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: './tests/setup.ts',
    coverage: { provider: 'istanbul' },
  },
});
