export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

export type TimeFilterValue = string | TimeRange;

// The time units a relative bound is expressed in. The set mirrors what the query service's
// subtraction function accepts; a deployment whose catalog accepts fewer is honoured by checking the
// served argument's allowed values before a bound is emitted, never by editing this list.
export enum RelativeTimeUnit {
  Second = 'second',
  Minute = 'minute',
  Hour = 'hour',
  Day = 'day',
  Month = 'month',
  Year = 'year',
}
