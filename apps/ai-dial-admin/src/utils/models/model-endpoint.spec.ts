import { describe, expect, test } from 'vitest';
import { getEndpointPostfix } from './model-endpoint';
import { DialModelType } from '@/src/models/dial/model';

describe('getEndpointPostfix', () => {
  test('returns chat/completions', () => {
    expect(getEndpointPostfix(DialModelType.Chat)).toBe('/chat/completions');
  });

  test('returns embeddings', () => {
    expect(getEndpointPostfix(DialModelType.Embedding)).toBe('/embeddings');
  });
});
