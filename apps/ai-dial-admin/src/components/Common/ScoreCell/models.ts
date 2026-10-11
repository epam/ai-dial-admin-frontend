export enum ScoreColorMode {
  Absolute = 'absolute',
  Delta = 'delta',
}

export interface ScoreCellBorderSides {
  top?: boolean;
  right?: boolean;
  bottom?: boolean;
  left?: boolean;
}

/**
 * Tailwind utility class names for one bucket. `background`/`text` are the bucket's own accent
 * colors; `border` is the same accent, for when a border should actually be visible (the hidden-value
 * grid-line case, or an explicit `isBorderVisible`); `backgroundBorder` points at the bucket's
 * *background* color instead — the default border, which blends into the cell so adjacent score
 * cells read as one continuous field instead of a grid of divided boxes.
 */
export interface ScoreCellBucketClasses {
  background: string;
  text: string;
  border: string;
  backgroundBorder: string;
}
