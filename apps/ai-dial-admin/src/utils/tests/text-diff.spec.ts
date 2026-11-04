import { describe, expect, test } from 'vitest';

import { TextDiffKind, TextDiffRange } from '@/src/models/text-diff';
import { getWordDiffRanges } from '@/src/utils/text-diff';

const slice = (text: string, ranges: TextDiffRange[]) => ranges.map(({ start, end }) => text.slice(start, end));

describe('Utils :: getWordDiffRanges', () => {
  test('Should return no ranges for identical texts', () => {
    expect(getWordDiffRanges('same text', 'same text')).toEqual({ original: [], modified: [] });
  });

  test('Should return no ranges for two empty texts', () => {
    expect(getWordDiffRanges('', '')).toEqual({ original: [], modified: [] });
  });

  test('Should mark the changed word on both sides', () => {
    const original = 'the answer is correct';
    const modified = 'the answer is wrong';
    const result = getWordDiffRanges(original, modified);

    expect(slice(original, result.original)).toEqual(['correct']);
    expect(slice(modified, result.modified)).toEqual(['wrong']);
  });

  test('Should mark an insertion only on the modified side', () => {
    const original = 'a b c';
    const modified = 'a b x c';
    const result = getWordDiffRanges(original, modified);

    expect(result.original).toEqual([]);
    expect(slice(modified, result.modified)).toEqual(['x']);
  });

  test('Should mark a removal only on the original side', () => {
    const original = 'a b x c';
    const modified = 'a b c';
    const result = getWordDiffRanges(original, modified);

    expect(slice(original, result.original)).toEqual(['x']);
    expect(result.modified).toEqual([]);
  });

  test('Should classify words replaced on both sides as changed', () => {
    const result = getWordDiffRanges('the answer is correct', 'the answer is wrong');

    expect(result.original.map(({ kind }) => kind)).toEqual([TextDiffKind.Changed]);
    expect(result.modified.map(({ kind }) => kind)).toEqual([TextDiffKind.Changed]);
  });

  test('Should classify words only the original has as removed and only the modified has as added', () => {
    expect(getWordDiffRanges('a b x c', 'a b c').original.map(({ kind }) => kind)).toEqual([TextDiffKind.Removed]);
    expect(getWordDiffRanges('a b c', 'a b x c').modified.map(({ kind }) => kind)).toEqual([TextDiffKind.Added]);
  });

  test('Should classify each gap on its own', () => {
    const result = getWordDiffRanges('a one b c d', 'a 1 b d e');

    expect(result.original.map(({ kind }) => kind)).toEqual([TextDiffKind.Changed, TextDiffKind.Removed]);
    expect(result.modified.map(({ kind }) => kind)).toEqual([TextDiffKind.Changed, TextDiffKind.Added]);
  });

  test('Should fold adjacent changed words into one range', () => {
    const original = 'start one two end';
    const modified = 'start three four five end';
    const result = getWordDiffRanges(original, modified);

    expect(slice(original, result.original)).toEqual(['one two']);
    expect(slice(modified, result.modified)).toEqual(['three four five']);
  });

  test('Should keep separate ranges apart when matched words sit between them', () => {
    const original = 'a one b two c';
    const modified = 'a 1 b 2 c';
    const result = getWordDiffRanges(original, modified);

    expect(slice(original, result.original)).toEqual(['one', 'two']);
    expect(slice(modified, result.modified)).toEqual(['1', '2']);
  });

  test('Should ignore whitespace and line break differences', () => {
    expect(getWordDiffRanges('a  b\nc', 'a b c')).toEqual({ original: [], modified: [] });
  });

  test('Should treat punctuation as its own token', () => {
    const original = 'value: "a"';
    const modified = 'value: "b"';
    const result = getWordDiffRanges(original, modified);

    expect(slice(original, result.original)).toEqual(['a']);
    expect(slice(modified, result.modified)).toEqual(['b']);
  });

  test('Should mark everything on the non-empty side when the other is empty', () => {
    const result = getWordDiffRanges('', 'new text');

    expect(result.original).toEqual([]);
    expect(result.modified).toEqual([{ start: 0, end: 8, kind: TextDiffKind.Added }]);
  });

  test('Should match words on both sides of a reordered change via the longest common subsequence', () => {
    const original = 'a b c d e';
    const modified = 'a c b d e';
    const result = getWordDiffRanges(original, modified);

    expect(slice(original, result.original).length).toBe(1);
    expect(slice(modified, result.modified).length).toBe(1);
  });

  test('Should skip the diff for texts too large to compare', () => {
    const original = Array.from({ length: 2500 }, (_, i) => `a${i}`).join(' ');
    const modified = Array.from({ length: 2500 }, (_, i) => `b${i}`).join(' ');

    expect(getWordDiffRanges(original, modified)).toEqual({ original: [], modified: [] });
  });
});
