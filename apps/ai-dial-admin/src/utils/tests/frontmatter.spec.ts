import { describe, expect, test } from 'vitest';

import { parseFrontmatter, stringifyFrontmatter } from '../frontmatter';

describe('parseFrontmatter', () => {
  test('parses attributes and body from a leading frontmatter block', () => {
    const content = '---\nname: my-skill\ndescription: Does a thing\n---\n# Heading\n\nBody text.\n';

    expect(parseFrontmatter(content)).toEqual({
      attributes: { name: 'my-skill', description: 'Does a thing' },
      body: '# Heading\n\nBody text.\n',
    });
  });

  test('treats content without a leading closed block as body', () => {
    const content = '---\nname: my-skill\n# Heading';

    expect(parseFrontmatter(content)).toEqual({ attributes: {}, body: content });
  });

  test('keeps later delimiters in the body', () => {
    const content = '---\nname: my-skill\n---\nBefore\n\n---\n\nAfter';

    expect(parseFrontmatter(content)).toEqual({
      attributes: { name: 'my-skill' },
      body: 'Before\n\n---\n\nAfter',
    });
  });

  test('throws when leading frontmatter contains invalid YAML', () => {
    expect(() => parseFrontmatter('---\nname: [\n---\nBody')).toThrow();
  });
});

describe('stringifyFrontmatter', () => {
  test('serializes attributes and adds a final newline to the body', () => {
    expect(stringifyFrontmatter({ name: 'my-skill', version: '2' }, 'Body')).toBe(
      '---\nname: my-skill\nversion: "2"\n---\nBody\n',
    );
  });
});
