/** Half-open `[start, end)` offsets into a string. */
export interface TextRange {
  start: number;
  end: number;
}

export enum TextDiffKind {
  /** Only the other text lacks these words. */
  Added = 'added',
  /** Only this text has these words. */
  Removed = 'removed',
  /** The other text has different words in this place. */
  Changed = 'changed',
}

export interface TextDiffRange extends TextRange {
  kind: TextDiffKind;
}

export interface TextDiffRanges {
  original: TextDiffRange[];
  modified: TextDiffRange[];
}
