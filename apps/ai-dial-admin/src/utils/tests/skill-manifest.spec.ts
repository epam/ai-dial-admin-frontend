import { describe, expect, test } from 'vitest';

import { buildSkillManifest, parseSkillManifest } from '../skill-manifest';

describe('parseSkillManifest', () => {
  test('parses name, description, and body from a valid manifest', () => {
    const content = '---\nname: my-skill\ndescription: Does a thing\n---\n# Heading\n\nBody text.\n';

    expect(parseSkillManifest(content)).toEqual({
      name: 'my-skill',
      description: 'Does a thing',
      body: '# Heading\n\nBody text.\n',
    });
  });

  test('falls back to empty strings when name or description is missing', () => {
    const content = '---\nversion: "1"\n---\nBody only.';

    expect(parseSkillManifest(content)).toEqual({ name: '', description: '', body: 'Body only.' });
  });

  test('does not misidentify a body containing further --- lines as extra frontmatter', () => {
    const content = '---\nname: my-skill\ndescription: Does a thing\n---\nBefore\n\n---\n\nAfter';

    const result = parseSkillManifest(content);
    expect(result.name).toBe('my-skill');
    expect(result.body).toBe('Before\n\n---\n\nAfter');
  });
});

describe('buildSkillManifest', () => {
  test('reassembles a document Core would accept', () => {
    const original = '---\nname: my-skill\ndescription: Old description\n---\nOld body.';

    const result = buildSkillManifest(original, {
      name: 'my-skill',
      description: 'New description',
      body: 'New body.',
    });

    expect(parseSkillManifest(result)).toEqual({
      name: 'my-skill',
      description: 'New description',
      body: 'New body.\n',
    });
  });

  test('round-trip preserves an untouched version key', () => {
    const original = '---\nname: my-skill\ndescription: Old description\nversion: "2"\n---\nOld body.';

    const result = buildSkillManifest(original, {
      name: 'my-skill',
      description: 'New description',
      body: 'New body.',
    });

    expect(parseSkillManifest(result)).toEqual({
      name: 'my-skill',
      description: 'New description',
      body: 'New body.\n',
    });
    // Confirm the raw serialized frontmatter still carries the untouched version value —
    // `parseSkillManifest`'s own return type only ever surfaces name/description/body.
    expect(result).toMatch(/version:\s*['"]?2['"]?/);
  });
});
