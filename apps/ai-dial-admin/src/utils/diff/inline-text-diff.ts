import { InlineTextDiffKind, InlineTextDiffSegment, InlineTextDiffSide } from '@/src/utils/diff/models';

const findCommonPrefixLength = (before: string, after: string): number => {
  const limit = Math.min(before.length, after.length);
  let index = 0;
  while (index < limit && before[index] === after[index]) {
    index++;
  }
  return index;
};

const findCommonSuffixLength = (before: string, after: string, prefixLength: number): number => {
  const beforeRemainder = before.length - prefixLength;
  const afterRemainder = after.length - prefixLength;
  const limit = Math.min(beforeRemainder, afterRemainder);
  let index = 0;
  while (index < limit && before[before.length - 1 - index] === after[after.length - 1 - index]) {
    index++;
  }
  return index;
};

export const buildInlineTextDiff = (
  before: string,
  after: string,
  side: InlineTextDiffSide,
): InlineTextDiffSegment[] => {
  if (before === after) {
    return [{ text: before, kind: InlineTextDiffKind.Equal }];
  }

  const prefixLength = findCommonPrefixLength(before, after);
  const suffixLength = findCommonSuffixLength(before, after, prefixLength);
  const prefix = before.slice(0, prefixLength);
  const suffix = before.slice(before.length - suffixLength);
  const beforeMiddle = before.slice(prefixLength, before.length - suffixLength);
  const afterMiddle = after.slice(prefixLength, after.length - suffixLength);

  const segments: InlineTextDiffSegment[] = [];

  if (prefix) {
    segments.push({ text: prefix, kind: InlineTextDiffKind.Equal });
  }

  if (side === InlineTextDiffSide.Before) {
    if (beforeMiddle) {
      segments.push({ text: beforeMiddle, kind: InlineTextDiffKind.Delete });
    }
    if (suffix) {
      segments.push({ text: suffix, kind: InlineTextDiffKind.Equal });
    }
  } else {
    if (afterMiddle) {
      segments.push({ text: afterMiddle, kind: InlineTextDiffKind.Insert });
    }
    if (suffix) {
      segments.push({ text: after.slice(after.length - suffixLength), kind: InlineTextDiffKind.Equal });
    }
  }

  return segments;
};
