import { describe, expect, test } from 'vitest';

import { errorMessageIn } from '@/src/utils/analytics/hop-inspector/failure';

describe('errorMessageIn', () => {
  test('reads a JSON-RPC error by its message', () => {
    expect(
      errorMessageIn({ jsonrpc: '2.0', error: { code: -32600, message: 'Bad Request: Missing session ID' } }),
    ).toBe('Bad Request: Missing session ID');
  });

  test('reads a dialect error object by its own message', () => {
    expect(
      errorMessageIn({ type: 'error', error: { type: 'not_found_error', message: 'Endpoint not supported' } }),
    ).toBe('Endpoint not supported');
  });

  test('reads a top-level message where no error member wraps it', () => {
    expect(errorMessageIn({ message: 'upstream refused' })).toBe('upstream refused');
  });

  // The third recorded shape: the sentence is the member, with nothing to look under.
  test('reads a bare-string error member', () => {
    expect(errorMessageIn({ error: 'Skill validation failed' })).toBe('Skill validation failed');
  });

  test('reads a body recorded as one JSON string', () => {
    expect(errorMessageIn('No YAML frontmatter found')).toBe('No YAML frontmatter found');
  });

  // Nothing is rendered from a body matching no shape: a fragment of transport detail is not a message.
  test('yields nothing for a shape it does not recognise', () => {
    expect(errorMessageIn({ choices: [{ message: { content: 'an answer' } }] })).toBeNull();
    expect(errorMessageIn(['not', 'an', 'error'])).toBeNull();
    expect(errorMessageIn(null)).toBeNull();
  });

  test('yields nothing for a message that is only whitespace', () => {
    expect(errorMessageIn({ error: { message: '   ' } })).toBeNull();
    expect(errorMessageIn('  ')).toBeNull();
  });
});
