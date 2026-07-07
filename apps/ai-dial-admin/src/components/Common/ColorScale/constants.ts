export const ACCURACY_COLOR_MAP: Record<number, { bg: string; border: string }> = {
  0.1: { bg: '#69100B', border: '#ff6b6b' },
  0.2: { bg: '#6C210D', border: '#f26b5b' },
  0.3: { bg: '#59210A', border: '#e5764a' },
  0.4: { bg: '#5f2b18', border: '#a57a1d' },
  0.5: { bg: '#53320E', border: '#956b40' },
  0.6: { bg: '#362A0E', border: '#ad992f' },
  0.7: { bg: '#403d12', border: '#9aa63c' },
  0.8: { bg: '#223513', border: '#67a455' },
  0.9: { bg: '#0D3726', border: '#4ecba8' },
  1.0: { bg: '#022D1C', border: '#4dc87a' },
};

export const ACCURACY_THRESHOLDS = Object.keys(ACCURACY_COLOR_MAP)
  .map(Number)
  .sort((a, b) => a - b);
