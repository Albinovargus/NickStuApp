import { describe, it, expect } from 'vitest';
import {
  WelcomeEmailJobDataSchema,
} from '../jobs.schema.js';

describe('WelcomeEmailJobDataSchema', () => {
  it('parses valid data', () => {
    const result = WelcomeEmailJobDataSchema.parse({
      userId: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
      displayName: 'Test User',
    });
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.email).toBe('test@example.com');
    expect(result.displayName).toBe('Test User');
  });

  it('rejects invalid UUID', () => {
    expect(() =>
      WelcomeEmailJobDataSchema.parse({
        userId: 'not-a-uuid',
        email: 'test@example.com',
        displayName: 'Test User',
      }),
    ).toThrow();
  });

  it('rejects invalid email', () => {
    expect(() =>
      WelcomeEmailJobDataSchema.parse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'not-email',
        displayName: 'Test User',
      }),
    ).toThrow();
  });

  it('rejects missing displayName', () => {
    expect(() =>
      WelcomeEmailJobDataSchema.parse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
      }),
    ).toThrow();
  });
});
