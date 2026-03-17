import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ApiSuccessSchema, ApiErrorSchema } from '../api-response.js';

describe('ApiSuccessSchema', () => {
  const DataSchema = z.object({ name: z.string() });
  const schema = ApiSuccessSchema(DataSchema);

  it('parses valid success response', () => {
    const result = schema.parse({ success: true, data: { name: 'Test' } });
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Test');
  });

  it('rejects when success is false', () => {
    expect(() => schema.parse({ success: false, data: { name: 'Test' } })).toThrow();
  });

  it('rejects when data is invalid', () => {
    expect(() => schema.parse({ success: true, data: { name: 123 } })).toThrow();
  });

  it('rejects missing data', () => {
    expect(() => schema.parse({ success: true })).toThrow();
  });
});

describe('ApiErrorSchema', () => {
  it('parses valid error response', () => {
    const result = ApiErrorSchema.parse({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found' },
    });
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('rejects when success is true', () => {
    expect(() =>
      ApiErrorSchema.parse({
        success: true,
        error: { code: 'ERR', message: 'msg' },
      }),
    ).toThrow();
  });

  it('rejects missing error code', () => {
    expect(() =>
      ApiErrorSchema.parse({
        success: false,
        error: { message: 'msg' },
      }),
    ).toThrow();
  });

  it('rejects missing error message', () => {
    expect(() =>
      ApiErrorSchema.parse({
        success: false,
        error: { code: 'ERR' },
      }),
    ).toThrow();
  });
});
