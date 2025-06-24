import { getItems } from '../utils';
import { SelectCellRendererParams } from '../SelectCellRenderer';
import { ALL_ID } from '@/src/constants/dial-base-entity';
import { describe, expect, test } from 'vitest';

describe('Cell renderer :: getItems ', () => {
  test('Should return provided items', () => {
    const params = {
      items: [{ id: 'id', name: 'name' }],
    } as SelectCellRendererParams;
    const result = getItems(params, (v: string) => v);
    expect(result).toEqual({
      items: [{ id: 'id', name: 'name' }],
      allItemsCount: 1,
    });
  });
  test('Should return provided items even if it is multi', () => {
    const params = {
      items: [{ id: 'id', name: 'name' }],
      isMulti: true,
    } as SelectCellRendererParams;
    const result = getItems(params, (v: string) => v);
    expect(result).toEqual({
      items: [{ id: 'id', name: 'name' }],
      allItemsCount: 1,
    });
  });
  test('Should return provided items with selectAll if it is multi and items > 1', () => {
    const params = {
      items: [
        { id: 'id', name: 'name' },
        { id: 'id2', name: 'name2' },
      ],
      isMulti: true,
    } as SelectCellRendererParams;
    const result = getItems(params, (v: string) => v);
    expect(result).toEqual({
      items: [
        {
          id: ALL_ID,
          name: 'Basic.SelectAll',
        },
        { id: 'id', name: 'name' },
        { id: 'id2', name: 'name2' },
      ],
      allItemsCount: 2,
    });
  });
  test('Should return items from getItems', () => {
    const params = {
      data: [{ id: '1' }, { id: '2' }],
      getItems: (data: { id: string }[]) => data.map((item) => ({ id: item.id, name: item.id })),
    } as SelectCellRendererParams;
    const result = getItems(params, (v: string) => v);
    expect(result).toEqual({
      items: [
        { id: '1', name: '1' },
        { id: '2', name: '2' },
      ],
      allItemsCount: 2,
    });
  });
});
