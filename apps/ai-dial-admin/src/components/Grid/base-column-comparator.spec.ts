import { baseColumnComparator, checkColDefsChanges } from './base-column-comparator';

describe('Grid :: baseColumnComparator', () => {
  it('Should handle equal numbers', () => {
    const res = baseColumnComparator(1, 1, {} as any, {} as any, false);
    expect(res).toBe(0);
  });

  it('Should handle inverted case false', () => {
    const res1 = baseColumnComparator(void 0, 'test', {} as any, {} as any, false);
    const res2 = baseColumnComparator('test', void 0, {} as any, {} as any, false);
    expect(res1).toBe(1);
    expect(res2).toBe(-1);
  });

  it('Should handle inverted case true', () => {
    const res1 = baseColumnComparator('test', '', {} as any, {} as any, true);
    const res2 = baseColumnComparator('', 'test', {} as any, {} as any, true);
    expect(res1).toBe(1);
    expect(res2).toBe(-1);
  });

  it('Should handle A > B', () => {
    const res = baseColumnComparator('testAA', 'testA', {} as any, {} as any, false);
    expect(res).toBe(1);
  });

  it('Should handle A < B', () => {
    const res = baseColumnComparator('testA', 'testAA', {} as any, {} as any, false);
    expect(res).toBe(-1);
  });
});

describe('Grid :: checkColDefsChanges', () => {
  it('Should return true if column order changed', () => {
    const defaultCols = [
      { field: '1', hide: false },
      { field: '2', hide: false },
      { field: '3', hide: false },
    ];
    const colDefs = [
      { field: '1', hide: false },
      { field: '3', hide: false },
      { field: '2', hide: false },
    ];
    const res = checkColDefsChanges(colDefs, defaultCols);
    expect(res).toBeTruthy();
  });
  it('Should return true if column visibility changed', () => {
    const defaultCols = [
      { field: '1', hide: false },
      { field: '2', hide: false },
      { field: '3', hide: false },
    ];
    const colDefs = [
      { field: '1', hide: false },
      { field: '2', hide: false },
      { field: '3', hide: true },
    ];
    const res = checkColDefsChanges(colDefs, defaultCols);
    expect(res).toBeTruthy();
  });
  it('Should return false if columns are same as default changed', () => {
    const defaultCols = [
      { field: '1', hide: false },
      { field: '2', hide: false },
      { field: '3', hide: false },
    ];
    const colDefs = [
      { field: '1', hide: false },
      { field: '2', hide: false },
      { field: '3', hide: true },
    ];
    const res = checkColDefsChanges(colDefs, defaultCols);
    expect(res).toBeTruthy();
  });
});
