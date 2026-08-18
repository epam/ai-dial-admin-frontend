import { describe, expect, test } from 'vitest';

import { narrowToModels } from '@/src/utils/analytics/conversation-models';

describe('narrowToModels', () => {
  test('leaves a single plain model untouched', () => {
    expect(narrowToModels(['fw.deepseek-v4-flash-0731'])).toEqual(['fw.deepseek-v4-flash-0731']);
  });

  test('drops a wrapping deployment named after the one it dispatched to', () => {
    expect(narrowToModels(['dial-chathub-v2-gemini-3.1-pro-preview', 'gemini-3.1-pro-preview'])).toEqual([
      'gemini-3.1-pro-preview',
    ]);
  });

  test('keeps an orchestrator that shares no name fragment with what it dispatched to', () => {
    const deployments = [
      'anthropic_switchyard-model',
      'anthropic.claude-haiku-4-5-20251001-v1:0',
      'anthropic.claude-opus-4-8',
    ];

    expect(narrowToModels(deployments)).toEqual(deployments);
  });

  test('drops an application resource path', () => {
    expect(narrowToModels(['applications/public/qa%202.0__0.0.1', 'gpt-4.1-2025-04-14'])).toEqual([
      'gpt-4.1-2025-04-14',
    ]);
  });

  test('drops a toolset resource path', () => {
    expect(narrowToModels(['toolsets/public/notion%20mcp__0.0.1', 'fw.kimi-k2.7-code'])).toEqual(['fw.kimi-k2.7-code']);
  });

  test.each([['text-embedding-3-large'], ['azure-ai-vision-embeddings'], ['multimodalembedding@001']])(
    'drops the embedding deployment %s',
    (embedding) => {
      expect(narrowToModels([embedding, 'gpt-4.1-2025-04-14'])).toEqual(['gpt-4.1-2025-04-14']);
    },
  );

  test('drops every excluded kind at once', () => {
    const deployments = [
      'applications/public/qa%202.0__0.0.1',
      'toolsets/public/notion%20mcp__0.0.1',
      'text-embedding-3-large',
      'dial-chathub-v2-gemini-3.1-pro-preview',
      'gemini-3.1-pro-preview',
    ];

    expect(narrowToModels(deployments)).toEqual(['gemini-3.1-pro-preview']);
  });

  test('falls back to the recorded list when narrowing would empty it', () => {
    const deployments = ['applications/public/qa%202.0__0.0.1'];

    expect(narrowToModels(deployments)).toEqual(deployments);
  });

  test('falls back for an embedding-only conversation', () => {
    expect(narrowToModels(['text-embedding-3-large'])).toEqual(['text-embedding-3-large']);
  });

  test.each([
    ['an empty array', []],
    ['no argument', undefined],
  ])('returns an empty list for %s', (_label, deployments) => {
    expect(narrowToModels(deployments)).toEqual([]);
  });
});
