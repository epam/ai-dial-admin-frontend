// The split is measured in percentages of the available height, never in pixels: a size that clears the
// floor at one viewport height is below it at a shorter one, and the floor has to hold in both.
export const MIN_SPLIT_PERCENT = 20;

// Also the highest a floor can be — a floor above half leaves neither section a legal range.
export const DEFAULT_SPLIT_PERCENT = 50;

export const SPLIT_STEP_PERCENT = 5;

// A hit area, not a share of the space: the library's 10px default clipped the grip, and no taller than this
// because half of it reaches into the section below, whose padding is 8px.
export const SPLIT_HANDLE_HEIGHT = 16;
