import { describe, expect, test } from 'vitest';

import { buildInlineTextDiff } from '@/src/utils/diff/inline-text-diff';
import { InlineTextDiffKind, InlineTextDiffSide } from '@/src/utils/diff/models';

describe('buildInlineTextDiff', () => {
  test('returns equal segment when strings are identical', () => {
    expect(buildInlineTextDiff('hello', 'hello', InlineTextDiffSide.Before)).toEqual([
      { text: 'hello', kind: InlineTextDiffKind.Equal },
    ]);
    expect(buildInlineTextDiff('hello', 'hello', InlineTextDiffSide.After)).toEqual([
      { text: 'hello', kind: InlineTextDiffKind.Equal },
    ]);
  });

  test('highlights single-char append on after side', () => {
    expect(buildInlineTextDiff('hello', 'hello.', InlineTextDiffSide.Before)).toEqual([
      { text: 'hello', kind: InlineTextDiffKind.Equal },
    ]);
    expect(buildInlineTextDiff('hello', 'hello.', InlineTextDiffSide.After)).toEqual([
      { text: 'hello', kind: InlineTextDiffKind.Equal },
      { text: '.', kind: InlineTextDiffKind.Insert },
    ]);
  });

  test('highlights single-char deletion on before side', () => {
    expect(buildInlineTextDiff('hello.', 'hello', InlineTextDiffSide.Before)).toEqual([
      { text: 'hello', kind: InlineTextDiffKind.Equal },
      { text: '.', kind: InlineTextDiffKind.Delete },
    ]);
    expect(buildInlineTextDiff('hello.', 'hello', InlineTextDiffSide.After)).toEqual([
      { text: 'hello', kind: InlineTextDiffKind.Equal },
    ]);
  });

  test('handles full replacement', () => {
    expect(buildInlineTextDiff('old', 'new', InlineTextDiffSide.Before)).toEqual([
      { text: 'old', kind: InlineTextDiffKind.Delete },
    ]);
    expect(buildInlineTextDiff('old', 'new', InlineTextDiffSide.After)).toEqual([
      { text: 'new', kind: InlineTextDiffKind.Insert },
    ]);
  });

  test('handles empty to non-empty', () => {
    expect(buildInlineTextDiff('', 'added', InlineTextDiffSide.Before)).toEqual([]);
    expect(buildInlineTextDiff('', 'added', InlineTextDiffSide.After)).toEqual([
      { text: 'added', kind: InlineTextDiffKind.Insert },
    ]);
  });

  test('handles non-empty to empty', () => {
    expect(buildInlineTextDiff('removed', '', InlineTextDiffSide.Before)).toEqual([
      { text: 'removed', kind: InlineTextDiffKind.Delete },
    ]);
    expect(buildInlineTextDiff('removed', '', InlineTextDiffSide.After)).toEqual([]);
  });

  test('highlights single contiguous suffix append', () => {
    expect(buildInlineTextDiff('eee', 'eee, some new description', InlineTextDiffSide.Before)).toEqual([
      { text: 'eee', kind: InlineTextDiffKind.Equal },
    ]);
    expect(buildInlineTextDiff('eee', 'eee, some new description', InlineTextDiffSide.After)).toEqual([
      { text: 'eee', kind: InlineTextDiffKind.Equal },
      { text: ', some new description', kind: InlineTextDiffKind.Insert },
    ]);
  });

  test('highlights single word change in the middle', () => {
    expect(
      buildInlineTextDiff('eee, some old description', 'eee, some new description', InlineTextDiffSide.Before),
    ).toEqual([
      { text: 'eee, some ', kind: InlineTextDiffKind.Equal },
      { text: 'old', kind: InlineTextDiffKind.Delete },
      { text: ' description', kind: InlineTextDiffKind.Equal },
    ]);
    expect(
      buildInlineTextDiff('eee, some old description', 'eee, some new description', InlineTextDiffSide.After),
    ).toEqual([
      { text: 'eee, some ', kind: InlineTextDiffKind.Equal },
      { text: 'new', kind: InlineTextDiffKind.Insert },
      { text: ' description', kind: InlineTextDiffKind.Equal },
    ]);
  });

  test('highlights inserted middle segment on after side', () => {
    const beforeSegments = buildInlineTextDiff('abcdef', 'abcXYZdef', InlineTextDiffSide.Before);
    const afterSegments = buildInlineTextDiff('abcdef', 'abcXYZdef', InlineTextDiffSide.After);

    expect(beforeSegments.every((s) => s.kind === InlineTextDiffKind.Equal)).toBe(true);
    expect(afterSegments.some((s) => s.kind === InlineTextDiffKind.Insert)).toBe(true);
    expect(afterSegments.map((s) => s.text).join('')).toBe('abcXYZdef');
  });
});
