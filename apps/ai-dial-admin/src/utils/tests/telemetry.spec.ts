import { numberValueFormatter } from '@/src/utils/telemetry';
import { ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';

describe('Utils :: telemetry :: numberValueFormatter', () => {
  it('Should return empty string', () => {
    const date = numberValueFormatter({ data: { col: null }, colDef: { field: 'col' } } as ValueFormatterParams);

    expect(date).toBe('');
  });

  it('Should return 12', () => {
    const date = numberValueFormatter({ data: { col: 12 }, colDef: { field: 'col' } } as ValueFormatterParams);

    expect(date).toBe('12');
  });
});
