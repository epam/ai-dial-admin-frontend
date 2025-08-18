import { describe, expect, test } from 'vitest';
import { splitEndpoint } from '../utils';
import { DialModelType } from '@/src/models/dial/model';

describe('splitEndpoint', () => {
  test('returns correct baseEndpoint and postfix for chat model', () => {
    const model = {
      type: DialModelType.Chat,
      endpoint: 'https://api.example.com/chat/completions',
    } as any;
    const adapters = [{ baseEndpoint: 'https://api.example.com' }, { baseEndpoint: 'https://other.com' }] as any;

    const [base, postfix] = splitEndpoint(model, adapters);
    expect(base).toBe('https://api.example.com');
    expect(postfix).toBe('chat/completions');
  });

  test('returns correct baseEndpoint and postfix for embedding model', () => {
    const model = {
      type: DialModelType.Embedding,
      endpoint: 'https://api.example.com/embeddings',
    } as any;
    const adapters = [{ baseEndpoint: 'https://api.example.com' }, { baseEndpoint: 'https://other.com' }] as any;

    const [base, postfix] = splitEndpoint(model, adapters);
    expect(base).toBe('https://api.example.com');
    expect(postfix).toBe('embeddings');
  });

  test('returns empty baseEndpoint if no adapter matches', () => {
    const model = {
      type: DialModelType.Chat,
      endpoint: 'https://unknown.com/chat/completions',
    } as any;
    const adapters = [{ baseEndpoint: 'https://api.example.com' }, { baseEndpoint: 'https://other.com' }] as any;

    const [base, postfix] = splitEndpoint(model, adapters);
    expect(base).toBe('');
    expect(postfix).toBe('chat/completions');
  });

  test('handles missing endpoint gracefully', () => {
    const model = {
      type: DialModelType.Chat,
      endpoint: undefined,
    } as any;
    const adapters = [{ baseEndpoint: 'https://api.example.com' }] as any;

    const [base, postfix] = splitEndpoint(model, adapters);
    expect(base).toBe('');
    expect(postfix).toBe('chat/completions');
  });
});
