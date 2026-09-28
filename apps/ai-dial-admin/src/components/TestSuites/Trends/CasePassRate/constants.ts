/** Characters of a run id used as a bar label when the run has no name. */
export const RUN_LABEL_FALLBACK_LENGTH = 8;

/** Track height; its full height always represents a run's `totalCount`. Sized to sit level with
 * Overall Score Trend's chart, which shares its row. */
export const BAR_TRACK_HEIGHT = 90;

/** Bars grow to fill the chart column, capped so a two-run window does not render colour slabs and
 * floored so a full window scrolls rather than slivers. */
export const BAR_WIDTH = 32;
export const BAR_MIN_WIDTH = 24;
export const BAR_MAX_WIDTH = 72;

/** The latest bar stays this much wider than a trend bar at every size; a fixed width would invert
 * the emphasis once the trend bars grew past it. */
export const LATEST_BAR_SCALE = 1.4;
export const LATEST_BAR_WIDTH = Math.round(BAR_WIDTH * LATEST_BAR_SCALE);
export const LATEST_BAR_MIN_WIDTH = Math.round(BAR_MIN_WIDTH * LATEST_BAR_SCALE);
export const LATEST_BAR_MAX_WIDTH = Math.round(BAR_MAX_WIDTH * LATEST_BAR_SCALE);

/** Rotated labels truncate along their height, so this is their length budget — ~10 characters. */
export const BAR_LABEL_HEIGHT = 64;

/** Shared by the card header's "Latest Run" heading and the readout so the two cannot drift apart.
 * Fixed, not a minimum: `SummarySection` right-aligns the header cell, so equal widths are what
 * line them up. The column divider belongs to the body cell alone — here it would render a
 * detached stub in the header. */
export const READOUT_COLUMN_CLASSES = 'w-full xl:w-48 xl:pl-6';

/** Legend status icon size, matching the shared pass/fail breakdown. */
export const SEGMENT_ICON_SIZE = 12;

/** Bar segment background token per group (design.md D2). */
export const SEGMENT_BG_CLASSES = {
  passed: 'bg-accent-secondary',
  failed: 'bg-red-400',
  errored: 'bg-secondary',
  notScored: 'bg-yellow-400',
} as const;
