export const ACCURACY_COLOR_MAP: Record<number, { bg: string; border: string }> = {
  0.1: { bg: '#69100B', border: '#AB383A' },
  0.2: { bg: '#6C210D', border: '#99391F' },
  0.3: { bg: '#59210A', border: '#C06536' },
  0.4: { bg: '#A83B0380', border: '#9F6547' },
  0.5: { bg: '#53320E', border: '#956B40' },
  0.6: { bg: '#362A0E', border: '#7C715FBF' },
  0.7: { bg: '#575003A6', border: '#868148BF' },
  0.8: { bg: '#223513', border: '#757F52BF' },
  0.9: { bg: '#0D3726', border: '#427661' },
  1.0: { bg: '#022D1C', border: '#2B6316' },
};

export const ACCURACY_THRESHOLDS = Object.keys(ACCURACY_COLOR_MAP)
  .map(Number)
  .sort((a, b) => a - b);
