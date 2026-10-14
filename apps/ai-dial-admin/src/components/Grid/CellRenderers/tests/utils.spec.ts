import { getAvatarInitials, getItems } from '../utils';
import { SelectCellRendererParams } from '../SelectCellRenderer';
import { describe, expect, test } from 'vitest';

describe('Cell renderer :: getItems ', () => {
  test('Should return provided items', () => {
    const params = {
      items: [{ value: 'id', label: 'name' }],
    } as SelectCellRendererParams;
    const result = getItems(params);
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
    const result = getItems(params);
    expect(result).toEqual({
      items: [{ value: 'id', label: 'name' }],
      allItemsCount: 1,
    });
  });
  test('Should return items from getItems', () => {
    const params = {
      data: [{ value: '1' }, { value: '2' }],
      getItems: (data: { value: string }[]) => data.map((item) => ({ value: item.value, label: item.value })),
    } as SelectCellRendererParams;
    const result = getItems(params);
    expect(result).toEqual({
      items: [
        { value: '1', label: '1' },
        { value: '2', label: '2' },
      ],
      allItemsCount: 2,
    });
  });
});

describe('getAvatarInitials', () => {
  test('returns the first two digits of a numeric name', () => {
    expect(getAvatarInitials('567393')).toBe('56');
    expect(getAvatarInitials('7')).toBe('7');
  });

  test('uses the digits of a name made of digits and symbols', () => {
    expect(getAvatarInitials('#42-1')).toBe('42');
  });

  test('leaves names with letters to the kit', () => {
    expect(getAvatarInitials('Claude Opus')).toBeUndefined();
    expect(getAvatarInitials('gpt-4')).toBeUndefined();
  });

  test('returns undefined for an empty name or one without letters or digits', () => {
    expect(getAvatarInitials()).toBeUndefined();
    expect(getAvatarInitials('')).toBeUndefined();
    expect(getAvatarInitials('---')).toBeUndefined();
  });
});
