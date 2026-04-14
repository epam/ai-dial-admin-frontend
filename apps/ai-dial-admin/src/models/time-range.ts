export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

export type TimeFilterValue = string | TimeRange;

export enum CalendarAlignment {
  Left = 'left',
  Right = 'right',
}

export const isTimeRange = (value: TimeFilterValue | undefined): value is TimeRange =>
  typeof value === 'object' && value !== null;
