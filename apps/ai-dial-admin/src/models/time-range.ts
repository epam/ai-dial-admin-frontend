export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

export type TimeFilterValue = string | TimeRange;
