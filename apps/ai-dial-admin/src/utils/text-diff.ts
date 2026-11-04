import { TextDiffKind, TextDiffRanges } from '@/src/models/text-diff';

interface Token {
  value: string;
  start: number;
  end: number;
}

// Whitespace is not a token: runs of words that differ only in spacing or line breaks must not light up.
const TOKEN_PATTERN = /[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu;

// The LCS table is (n + 1) * (m + 1) cells; past this the diff is skipped rather than freezing the tab.
const MAX_DIFF_CELLS = 4_000_000;

const NO_DIFF: TextDiffRanges = { original: [], modified: [] };

const tokenize = (text: string): Token[] =>
  Array.from(text.matchAll(TOKEN_PATTERN), (match) => {
    const start = match.index ?? 0;
    return { value: match[0], start, end: start + match[0].length };
  });

type MatchedPair = [originalIndex: number, modifiedIndex: number];

/** The tokens the two texts share, as ascending index pairs; `null` when the texts are too large to compare. */
const findMatchedPairs = (original: Token[], modified: Token[]): MatchedPair[] | null => {
  const head: MatchedPair[] = [];
  while (
    head.length < original.length &&
    head.length < modified.length &&
    original[head.length].value === modified[head.length].value
  ) {
    head.push([head.length, head.length]);
  }

  const tail: MatchedPair[] = [];
  let originalEnd = original.length;
  let modifiedEnd = modified.length;
  while (
    originalEnd > head.length &&
    modifiedEnd > head.length &&
    original[originalEnd - 1].value === modified[modifiedEnd - 1].value
  ) {
    originalEnd--;
    modifiedEnd--;
    tail.unshift([originalEnd, modifiedEnd]);
  }

  const offset = head.length;
  const rows = originalEnd - offset;
  const cols = modifiedEnd - offset;
  if (rows === 0 || cols === 0) {
    return [...head, ...tail];
  }
  if (rows * cols > MAX_DIFF_CELLS) {
    return null;
  }

  // lcs[i][j] = longest common subsequence of original[offset + i ..] and modified[offset + j ..]. Its values
  // are bounded by min(rows, cols), which the cell cap keeps far below Uint16's range.
  const width = cols + 1;
  const lcs = new Uint16Array((rows + 1) * width);
  for (let i = rows - 1; i >= 0; i--) {
    for (let j = cols - 1; j >= 0; j--) {
      lcs[i * width + j] =
        original[offset + i].value === modified[offset + j].value
          ? lcs[(i + 1) * width + j + 1] + 1
          : Math.max(lcs[(i + 1) * width + j], lcs[i * width + j + 1]);
    }
  }

  const middle: MatchedPair[] = [];
  let i = 0;
  let j = 0;
  while (i < rows && j < cols) {
    if (original[offset + i].value === modified[offset + j].value) {
      middle.push([offset + i, offset + j]);
      i++;
      j++;
    } else if (lcs[(i + 1) * width + j] >= lcs[i * width + j + 1]) {
      i++;
    } else {
      j++;
    }
  }

  return [...head, ...middle, ...tail];
};

/**
 * Each run of tokens between two matched pairs is one range. A run with a counterpart on the other
 * side is a change; a run facing nothing is a removal (original) or an addition (modified).
 */
const toRanges = (original: Token[], modified: Token[], pairs: MatchedPair[]): TextDiffRanges => {
  const ranges: TextDiffRanges = { original: [], modified: [] };
  let previousOriginal = -1;
  let previousModified = -1;

  for (const [originalIndex, modifiedIndex] of [...pairs, [original.length, modified.length] as MatchedPair]) {
    const hasOriginalGap = originalIndex - previousOriginal > 1;
    const hasModifiedGap = modifiedIndex - previousModified > 1;

    if (hasOriginalGap) {
      ranges.original.push({
        start: original[previousOriginal + 1].start,
        end: original[originalIndex - 1].end,
        kind: hasModifiedGap ? TextDiffKind.Changed : TextDiffKind.Removed,
      });
    }
    if (hasModifiedGap) {
      ranges.modified.push({
        start: modified[previousModified + 1].start,
        end: modified[modifiedIndex - 1].end,
        kind: hasOriginalGap ? TextDiffKind.Changed : TextDiffKind.Added,
      });
    }

    previousOriginal = originalIndex;
    previousModified = modifiedIndex;
  }

  return ranges;
};

/**
 * Word-level diff of two texts, as the ranges of each side that the other side lacks. Returns no
 * ranges when the texts match or when they are too large to diff.
 */
export const getWordDiffRanges = (original: string, modified: string): TextDiffRanges => {
  if (original === modified) {
    return NO_DIFF;
  }

  const originalTokens = tokenize(original);
  const modifiedTokens = tokenize(modified);
  const pairs = findMatchedPairs(originalTokens, modifiedTokens);

  return pairs ? toRanges(originalTokens, modifiedTokens, pairs) : NO_DIFF;
};
