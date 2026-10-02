import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Vitest globals are off, so RTL's automatic cleanup doesn't register itself.
afterEach(() => cleanup());
