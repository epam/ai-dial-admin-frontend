export const SCORE_INDICATOR_DEFAULT_WIDTH = 40;

export const SCORE_INDICATOR_COMPARE_WIDTH = 49;

export const SCORE_INDICATOR_STEPS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] as const;

export const SCORE_INDICATOR_COLORS: Record<number, string> = {
  0: 'transparent',
  0.1: '#f26b5b',
  0.2: '#e5764a',
  0.3: '#e08c3f',
  0.4: '#d9a638',
  0.5: '#d4be3a',
  0.6: '#b8c94a',
  0.7: '#7ec96b',
  0.8: '#4ecba8',
  0.9: '#4ec5c5',
  1: '#4dc87a',
};
