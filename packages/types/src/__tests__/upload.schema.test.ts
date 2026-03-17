import { describe, it, expect } from 'vitest';
import { UploadResultSchema } from '../upload.schema.js';

describe('UploadResultSchema', () => {
  it('parses valid upload result', () => {
    const result = UploadResultSchema.parse({
      path: 'abc.pdf',
      url: 'https://example.com/signed',
    });
    expect(result.path).toBe('abc.pdf');
    expect(result.url).toBe('https://example.com/signed');
  });

  it('parses with url: null (nullable)', () => {
    const result = UploadResultSchema.parse({
      path: 'abc.pdf',
      url: null,
    });
    expect(result.path).toBe('abc.pdf');
    expect(result.url).toBeNull();
  });

  it('rejects missing path', () => {
    expect(() =>
      UploadResultSchema.parse({ url: 'https://example.com/signed' }),
    ).toThrow();
  });

  it('rejects invalid url (not a URL string and not null)', () => {
    expect(() =>
      UploadResultSchema.parse({ path: 'abc.pdf', url: 'not-a-url' }),
    ).toThrow();
  });
});
