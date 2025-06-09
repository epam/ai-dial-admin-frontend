export const DEFAULT_TIME_PERIOD = '2d';

export const timePeriodOptionsConfig = [
  { id: '15m', name: 'Last 15 min', offset: 15 * 60 * 1000 },
  { id: '30m', name: 'Last 30 min', offset: 30 * 60 * 1000 },
  { id: '1h', name: 'Last 1 h', offset: 60 * 60 * 1000 },
  { id: '3h', name: 'Last 3 h', offset: 3 * 60 * 60 * 1000 },
  { id: '6h', name: 'Last 6 h', offset: 6 * 60 * 60 * 1000 },
  { id: '12h', name: 'Last 12 h', offset: 12 * 60 * 60 * 1000 },
  { id: '24h', name: 'Last 24 h', offset: 24 * 60 * 60 * 1000 },
  { id: '2d', name: 'Last 2 d', offset: 2 * 24 * 60 * 60 * 1000 },
  { id: '7d', name: 'Last 7 d', offset: 7 * 24 * 60 * 60 * 1000 },
];
