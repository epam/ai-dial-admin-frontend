export const SCORE_INDICATOR_DEFAULT_WIDTH = 40;

export const SCORE_INDICATOR_COMPARE_WIDTH = 49;

export const SCORE_INDICATOR_STEPS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] as const;

export const SCORE_INDICATOR_EMPTY_COLOR = 'transparent';

// Guards against float drift (e.g. 0.3 * 10 === 2.9999999999999996) when flooring into a 0.1 bucket.
export const SCORE_INDICATOR_STEP_EPSILON = 1e-9;

// Keyed by the lower bound of each bucket: step `s` covers scores in `[s, s + 0.1)`, except `1` (exact).
export const SCORE_INDICATOR_COLORS: Record<number, string> = {
  0: '#f26b5b',
  0.1: '#e5764a',
  0.2: '#e08c3f',
  0.3: '#d9a638',
  0.4: '#d4be3a',
  0.5: '#b8c94a',
  0.6: '#7ec96b',
  0.7: '#4ecba8',
  0.8: '#4ec5c5',
  0.9: '#4dc87a',
  1: '#30e070',
};
