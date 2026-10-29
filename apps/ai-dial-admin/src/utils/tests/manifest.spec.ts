import { describe, expect, test } from 'vitest';

import { buildManifest, parseManifest } from '../manifest';

describe('parseManifest', () => {
  test('parses name, description and body', () => {
    expect(parseManifest('---\nname: p\ndescription: D\n---\nBody.\n')).toEqual({
      name: 'p',
      description: 'D',
      body: 'Body.\n',
    });
  });

  test('keeps the body verbatim, adding no blank-line handling', () => {
    expect(parseManifest('---\nname: p\n---\n\nBody').body).toBe('\nBody');
  });

  test('treats text without a frontmatter fence as the body', () => {
    const content = 'Just text.';

    expect(parseManifest(content)).toEqual({ name: '', description: '', body: content });
  });

  test('ignores a non-string description', () => {
    expect(parseManifest('---\nname: p\ndescription: 5\n---\nB').description).toBe('');
  });
});

describe('buildManifest', () => {
  test('keeps frontmatter keys other than name and description', () => {
    const original = '---\nname: p\ndescription: Old\nversion: "2"\n---\nOld body';

    const rebuilt = buildManifest(original, { name: 'p', description: 'New', body: 'New body' });

    expect(parseManifest(rebuilt)).toEqual({ name: 'p', description: 'New', body: 'New body\n' });
    expect(rebuilt).toContain('version');
  });

  test('a description with a fence and a newline round-trips without leaking into the body', () => {
    const description = 'first\n---\nsecond';

    const rebuilt = buildManifest('---\nname: p\ndescription: x\n---\n', { name: 'p', description, body: 'Body' });

    expect(parseManifest(rebuilt)).toEqual({ name: 'p', description, body: 'Body\n' });
  });

  test('builds a document from scratch when the original has no frontmatter', () => {
    const rebuilt = buildManifest('', { name: 'p', description: 'D', body: '' });

    expect(parseManifest(rebuilt)).toMatchObject({ name: 'p', description: 'D' });
  });
});
