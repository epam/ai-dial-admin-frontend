import { describe, expect, test } from 'vitest';

import { buildProjectManifest, parseProjectManifest, toContextFileName, toContextFilePath } from '../project-manifest';

describe('buildProjectManifest', () => {
  test('writes chat-compatible frontmatter, a blank line, then the instructions verbatim', () => {
    expect(buildProjectManifest('', { name: 'p', description: 'D', instructions: '# Do it' })).toBe(
      '---\nname: p\ndescription: D\n---\n\n# Do it',
    );
  });

  test('creates a manifest with an empty body', () => {
    expect(buildProjectManifest('', { name: 'p', description: 'D', instructions: '' })).toBe(
      '---\nname: p\ndescription: D\n---\n\n',
    );
  });

  test('adds no trailing newline to the instructions', () => {
    expect(buildProjectManifest('', { name: 'p', description: 'D', instructions: 'x' }).endsWith('x')).toBe(true);
  });

  test('carries frontmatter keys written by another client after name and description', () => {
    const original = '---\nname: p\ndescription: Old\nowner: team-a\n---\n\nOld';

    const rebuilt = buildProjectManifest(original, { name: 'p', description: 'New', instructions: 'New' });

    expect(rebuilt).toBe('---\nname: p\ndescription: New\nowner: team-a\n---\n\nNew');
  });

  test('a description with a fence and a newline cannot close the frontmatter', () => {
    const description = 'a\n---\nb';

    const rebuilt = buildProjectManifest('', { name: 'p', description, instructions: 'Body' });

    expect(parseProjectManifest(rebuilt)).toEqual({ name: '', description, instructions: 'Body' });
  });
});

describe('parseProjectManifest', () => {
  test('reads the description and strips the single blank line before the instructions', () => {
    expect(parseProjectManifest('---\nname: p\ndescription: D\n---\n\n# Do it\n')).toEqual({
      name: '',
      description: 'D',
      instructions: '# Do it\n',
    });
  });

  test('keeps text without frontmatter whole as the instructions', () => {
    expect(parseProjectManifest('Just text.')).toEqual({ name: '', description: '', instructions: 'Just text.' });
  });

  test('ignores a non-string description', () => {
    expect(parseProjectManifest('---\ndescription: 5\n---\n\nB').description).toBe('');
  });

  test('round-trips a manifest it built', () => {
    const built = buildProjectManifest('', { name: 'p', description: 'D', instructions: 'Line 1\n\nLine 2' });

    expect(parseProjectManifest(built).instructions).toBe('Line 1\n\nLine 2');
  });
});

describe('context file paths', () => {
  test('toContextFilePath prefixes the context folder', () => {
    expect(toContextFilePath('a.csv')).toBe('context/a.csv');
  });

  test.each([
    ['context/a.csv', 'a.csv'],
    ['context/sub/b.pdf', 'sub/b.pdf'],
  ])('toContextFileName maps %s to %s', (path, expected) => {
    expect(toContextFileName(path)).toBe(expected);
  });

  test.each(['PROJECT.md', 'notes/b.txt', 'context/', 'context', 'contextual/a.csv'])(
    'toContextFileName hides %s',
    (path) => {
      expect(toContextFileName(path)).toBeUndefined();
    },
  );
});
