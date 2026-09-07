import { Measure } from '@/src/models/analytics/pipeline';
import { MeasureRow } from '@/src/models/analytics/pipeline-ui';
export const createMeasureRow = (): MeasureRow => ({ id: crypto.randomUUID(), name: '', fn: '' });
export const toMeasureRows = (measures?: Measure[]): MeasureRow[] =>
  (measures ?? []).map((measure) => ({ id: crypto.randomUUID(), ...measure }));
export const toMeasures = (rows: MeasureRow[]): Measure[] =>
  rows
    .filter((row) => row.name && row.fn)
    .map((row) => ({
      name: row.name,
      fn: row.fn,
      ...(row.column ? { column: row.column } : {}),
      ...(row.where ? { where: row.where } : {}),
      ...(row.distinct ? { distinct: true } : {}),
    }));
