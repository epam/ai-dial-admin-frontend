export enum InlineTextDiffKind {
  Equal = 'equal',
  Insert = 'insert',
  Delete = 'delete',
}

export enum InlineTextDiffSide {
  Before = 'before',
  After = 'after',
}

export interface InlineTextDiffSegment {
  text: string;
  kind: InlineTextDiffKind;
}
