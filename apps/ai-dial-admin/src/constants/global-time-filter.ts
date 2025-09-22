export const DEFAULT_TIME_PERIOD = '2d';

export const timePeriodOptionsConfig = [
  { id: '15m', name: 'Last 15m', offset: 15 * 60 * 1000 },
  { id: '30m', name: 'Last 30m', offset: 30 * 60 * 1000 },
  { id: '1h', name: 'Last 1h', offset: 60 * 60 * 1000 },
  { id: '3h', name: 'Last 3h', offset: 3 * 60 * 60 * 1000 },
  { id: '6h', name: 'Last 6h', offset: 6 * 60 * 60 * 1000 },
  { id: '12h', name: 'Last 12h', offset: 12 * 60 * 60 * 1000 },
  { id: '24h', name: 'Last 24h', offset: 24 * 60 * 60 * 1000 },
  { id: '2d', name: 'Last 2d', offset: 2 * 24 * 60 * 60 * 1000 },
  { id: '7d', name: 'Last 7d', offset: 7 * 24 * 60 * 60 * 1000 },
];
