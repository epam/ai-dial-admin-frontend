import { describe, expect, test } from 'vitest';

import { getUpstreamsLosingSecret, stripEmptyUpstreamSecrets } from '../upstream-secrets';

describe('Models Utils :: stripEmptyUpstreamSecrets', () => {
  test('Should remove an empty key entirely, not send it as an empty string', () => {
    const [upstream] = stripEmptyUpstreamSecrets([{ endpoint: 'http://a', key: '' }]) ?? [];

    expect(upstream).not.toHaveProperty('key');
  });

  test('Should remove an undefined key', () => {
    const [upstream] = stripEmptyUpstreamSecrets([{ endpoint: 'http://a', key: undefined }]) ?? [];

    expect(upstream).not.toHaveProperty('key');
  });

  test('Should keep a supplied key', () => {
    const [upstream] = stripEmptyUpstreamSecrets([{ endpoint: 'http://a', key: 'real-secret' }]) ?? [];

    expect(upstream.key).toBe('real-secret');
  });

  test('Should remove an empty secretExtraData', () => {
    const [upstream] = stripEmptyUpstreamSecrets([{ endpoint: 'http://a', secretExtraData: '' }]) ?? [];

    expect(upstream).not.toHaveProperty('secretExtraData');
  });

  test('Should strip each upstream independently in a mixed array', () => {
    const stripped =
      stripEmptyUpstreamSecrets([
        { endpoint: 'http://a', key: '' },
        { endpoint: 'http://b', key: 'kept' },
        { endpoint: 'http://c' },
      ]) ?? [];

    expect(stripped[0]).not.toHaveProperty('key');
    expect(stripped[1].key).toBe('kept');
    expect(stripped[2]).not.toHaveProperty('key');
  });

  test('Should preserve every non-secret field', () => {
    const [upstream] = stripEmptyUpstreamSecrets([{ endpoint: 'http://a', key: '', weight: 3, tier: 1 }]) ?? [];

    expect(upstream).toEqual({ endpoint: 'http://a', weight: 3, tier: 1 });
  });

  test('Should pass undefined through rather than inventing an array', () => {
    expect(stripEmptyUpstreamSecrets(undefined)).toBeUndefined();
  });

  test('Should not mutate the input', () => {
    const input = [{ endpoint: 'http://a', key: '' }];
    stripEmptyUpstreamSecrets(input);

    expect(input[0]).toHaveProperty('key');
  });
});

describe('Models Utils :: getUpstreamsLosingSecret', () => {
  test('Should flag a renamed endpoint whose key was left blank', () => {
    const losing = getUpstreamsLosingSecret([{ endpoint: 'http://old' }], [{ endpoint: 'http://new' }]);

    expect(losing.map((upstream) => upstream.endpoint)).toEqual(['http://new']);
  });

  /**
   * Core returns neither secret on read, so there is no way to know which ones the stored upstream
   * actually had. Re-entering one therefore does not make a rename safe — the other is equally
   * unrecoverable — and the warning stays until both are supplied.
   */
  test('Should still flag a renamed endpoint when only the key was re-entered', () => {
    const losing = getUpstreamsLosingSecret(
      [{ endpoint: 'http://old' }],
      [{ endpoint: 'http://new', key: 'fresh-secret' }],
    );

    expect(losing.map((upstream) => upstream.endpoint)).toEqual(['http://new']);
  });

  test('Should not flag a renamed endpoint once both secrets are re-entered', () => {
    const losing = getUpstreamsLosingSecret(
      [{ endpoint: 'http://old' }],
      [{ endpoint: 'http://new', key: 'fresh-secret', secretExtraData: '{"a":1}' }],
    );

    expect(losing).toEqual([]);
  });

  test('Should not flag an added upstream, which never had a stored secret', () => {
    const losing = getUpstreamsLosingSecret(
      [{ endpoint: 'http://a' }],
      [{ endpoint: 'http://a' }, { endpoint: 'http://brand-new' }],
    );

    expect(losing).toEqual([]);
  });

  test('Should not treat an empty JSON object as a supplied secret', () => {
    const [upstream] = stripEmptyUpstreamSecrets([{ endpoint: 'http://a', secretExtraData: {} }]) ?? [];

    expect(upstream).not.toHaveProperty('secretExtraData');
  });

  test('Should not flag an unchanged endpoint, whose stored key Core still matches', () => {
    const losing = getUpstreamsLosingSecret([{ endpoint: 'http://same' }], [{ endpoint: 'http://same' }]);

    expect(losing).toEqual([]);
  });

  test('Should flag only the renamed entry when others are untouched', () => {
    const losing = getUpstreamsLosingSecret(
      [{ endpoint: 'http://a' }, { endpoint: 'http://b' }],
      [{ endpoint: 'http://a' }, { endpoint: 'http://b-renamed' }],
    );

    expect(losing.map((upstream) => upstream.endpoint)).toEqual(['http://b-renamed']);
  });

  test('Should not flag a newly added upstream on a model that had none', () => {
    expect(getUpstreamsLosingSecret([], [{ endpoint: 'http://new' }])).toEqual([]);
  });

  test('Should ignore an entry with no endpoint, which cannot route anyway', () => {
    expect(getUpstreamsLosingSecret([{ endpoint: 'http://old' }], [{ key: '' }])).toEqual([]);
  });
});
