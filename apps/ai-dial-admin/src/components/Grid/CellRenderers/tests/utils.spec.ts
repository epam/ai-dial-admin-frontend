import { getItems } from '../utils';
import { SelectCellRendererParams } from '../SelectCellRenderer';
import { ALL_ID } from '@/src/constants/dial-base-entity';
import { describe, expect, test } from 'vitest';

describe('Cell renderer :: getItems ', () => {
  test('Should return provided items', () => {
    const params = {
      items: [{ value: 'id', label: 'name' }],
    } as SelectCellRendererParams;
    const result = getItems(params, (v: string) => v);
    expect(result).toEqual({
      items: [{ value: 'id', label: 'name' }],
      allItemsCount: 1,
    });
  });
  test('Should return provided items even if it is multi', () => {
    const params = {
      items: [{ value: 'id', label: 'name' }],
      isMulti: true,
    } as SelectCellRendererParams;
    const result = getItems(params, (v: string) => v);
    expect(result).toEqual({
      items: [{ value: 'id', label: 'name' }],
      allItemsCount: 1,
    });
  });
  test('Should return provided items with selectAll if it is multi and items > 1', () => {
    const params = {
      items: [
        { value: 'id', label: 'name' },
        { value: 'id2', label: 'name2' },
      ],
      isMulti: true,
    } as SelectCellRendererParams;
    const result = getItems(params, (v: string) => v);
    expect(result).toEqual({
      items: [
        {
          value: ALL_ID,
          label: 'Basic.SelectAll',
        },
        { value: 'id', label: 'name' },
        { value: 'id2', label: 'name2' },
      ],
      allItemsCount: 2,
    });
  });
  test('Should return items from getItems', () => {
    const params = {
      data: [{ value: '1' }, { value: '2' }],
      getItems: (data: { value: string }[]) => data.map((item) => ({ value: item.value, label: item.value })),
    } as SelectCellRendererParams;
    const result = getItems(params, (v: string) => v);
    expect(result).toEqual({
      items: [
        { value: '1', label: '1' },
        { value: '2', label: '2' },
      ],
      allItemsCount: 2,
    });
  });
});
