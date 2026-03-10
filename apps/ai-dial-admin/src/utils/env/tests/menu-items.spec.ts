import { describe, expect, test } from 'vitest';
import { getActualMenuItems, getMenuItems } from '../get-menu-items';

describe('Utils :: menu items :: getActualMenuItems', () => {
  test('Should filter disabled items (incl. i18n.* keys) and drop groups that become empty', () => {
    const res = getActualMenuItems(
      [
        { key: 'A1', items: [{ key: 'i18n.Models' }, { key: 'Models' }, { key: 'i18n.Application' }] as any[] },
        { key: 'A2', items: [{ key: 'i18n.Roles' }] as any[] },
        { key: 'A3', items: [{ key: 'i18n.Models' }] as any[] },
      ] as any,
      ['models'],
    );

    expect(res).toEqual([
      { key: 'A1', items: [{ key: 'i18n.Application' }] as any[] },
      { key: 'A2', items: [{ key: 'i18n.Roles' }] as any[] },
    ]);
  });

  test('Should return all items when disableItems is empty', () => {
    const config = [{ key: 'A1', items: [{ key: 'i18n.Models' }, { key: 'Models' }] as any[] }];

    expect(getActualMenuItems(config as any, [])).toEqual(config);
  });
});

describe('Utils :: menu items :: getMenuItems', () => {
  test('Should return empty array', () => {
    const res = getMenuItems();

    expect(res).toEqual([]);
  });

  test('Should split by spaces and lower-case values', () => {
    const res = getMenuItems('AAA bBb');

    expect(res).toEqual(['aaa', 'bbb']);
  });
});
