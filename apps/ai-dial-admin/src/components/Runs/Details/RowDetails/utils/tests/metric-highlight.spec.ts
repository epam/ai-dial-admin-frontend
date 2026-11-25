import { describe, expect, test } from 'vitest';

import { getHighlightChunkClass, getMetricInfoHighlightRaw, parseMetricHighlight } from '../metric-highlight';

describe('getMetricInfoHighlightRaw', () => {
  test('serializes the highlight key of a leaf entry', () => {
    const raw = getMetricInfoHighlightRaw(
      { precision: { highlight: { corpus: [{ text: 'a', score: 1 }] }, reason: 'why' } },
      'precision',
    );

    expect(raw).toContain('"corpus"');
    expect(parseMetricHighlight(raw)).not.toBeNull();
  });

  test('returns null when the leaf has no highlight key', () => {
    expect(getMetricInfoHighlightRaw({ precision: { reason: 'why' } }, 'precision')).toBeNull();
    expect(getMetricInfoHighlightRaw(undefined, 'precision')).toBeNull();
  });
});

describe('parseMetricHighlight', () => {
  test('parses an object of named chunk arrays', () => {
    const raw = JSON.stringify({
      corpus: [
        { text: 'good', score: 1, title: '1.0' },
        { text: '\n', score: 0 },
        { text: 'bad', score: -1 },
      ],
    });

    expect(parseMetricHighlight(raw)).toEqual({
      sources: [
        {
          key: 'corpus',
          chunks: [
            { text: 'good', score: 1, title: '1.0' },
            { text: '\n', score: 0 },
            { text: 'bad', score: -1 },
          ],
        },
      ],
    });
  });

  test('parses a bare chunk array as one unnamed source', () => {
    const raw = JSON.stringify([
      { text: 'a', score: 0.5 },
      { text: 'b', score: -0.5 },
    ]);

    expect(parseMetricHighlight(raw)).toEqual({
      sources: [
        {
          key: null,
          chunks: [
            { text: 'a', score: 0.5 },
            { text: 'b', score: -0.5 },
          ],
        },
      ],
    });
  });

  test('keeps empty text chunks and skips non-array object keys', () => {
    const raw = JSON.stringify({
      corpus: [{ text: '', score: 0 }],
      version: 2,
      meta: { ignored: true },
    });

    expect(parseMetricHighlight(raw)).toEqual({
      sources: [{ key: 'corpus', chunks: [{ text: '', score: 0 }] }],
    });
  });

  test('collects every valid chunk array under an object', () => {
    const raw = JSON.stringify({
      corpus: [{ text: 'a', score: 0 }],
      answer: [{ text: 'b', score: 1 }],
    });

    expect(parseMetricHighlight(raw)?.sources).toHaveLength(2);
  });

  test('returns null for an object whose arrays are not chunk-shaped', () => {
    expect(parseMetricHighlight(JSON.stringify({ corpus: [{ chunk: 'x' }] }))).toBeNull();
    expect(parseMetricHighlight(JSON.stringify({ corpus: [{ text: 'x', score: '1' }] }))).toBeNull();
  });

  test('returns null for malformed JSON and non-highlight values', () => {
    expect(parseMetricHighlight(null)).toBeNull();
    expect(parseMetricHighlight('0.8')).toBeNull();
    expect(parseMetricHighlight('plain text')).toBeNull();
    expect(parseMetricHighlight('{not json')).toBeNull();
    expect(parseMetricHighlight(JSON.stringify({ a: 1 }))).toBeNull();
    expect(parseMetricHighlight(JSON.stringify([1, 2, 3]))).toBeNull();
    expect(parseMetricHighlight(JSON.stringify({ corpus: [] }))).toBeNull();
    expect(parseMetricHighlight('[]')).toBeNull();
  });

  test('returns null when a chunk score is not finite', () => {
    expect(parseMetricHighlight(JSON.stringify([{ text: 'x', score: Number.NaN }]))).toBeNull();
  });
});

describe('getHighlightChunkClass', () => {
  test('returns undefined for a neutral or non-finite score', () => {
    expect(getHighlightChunkClass(0)).toBeUndefined();
    expect(getHighlightChunkClass(Number.NaN)).toBeUndefined();
  });

  test('maps a positive score to a green delta bucket', () => {
    expect(getHighlightChunkClass(1)).toMatch(/bg-score-delta-p/);
    expect(getHighlightChunkClass(0.5)).toMatch(/bg-score-delta-p/);
  });

  test('maps a negative score to a red delta bucket', () => {
    expect(getHighlightChunkClass(-1)).toMatch(/bg-score-delta-n/);
    expect(getHighlightChunkClass(-0.5)).toMatch(/bg-score-delta-n/);
  });

  test('clamps scores outside [-1, 1] into the edge buckets', () => {
    expect(getHighlightChunkClass(2)).toBe(getHighlightChunkClass(1));
    expect(getHighlightChunkClass(-2)).toBe(getHighlightChunkClass(-1));
  });
});
