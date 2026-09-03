// The split is measured in percentages of the available height, never in pixels: a size that clears the
// floor at one viewport height is below it at a shorter one, and the floor has to hold in both.
export const MIN_SPLIT_PERCENT = 20;

// Also the highest a floor can be — a floor above half leaves neither section a legal range.
export const DEFAULT_SPLIT_PERCENT = 50;

export const SPLIT_STEP_PERCENT = 5;
