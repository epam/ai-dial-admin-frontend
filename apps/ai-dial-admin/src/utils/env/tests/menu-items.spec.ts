import { describe, expect, test } from 'vitest';
import { getActualMenuItems, getMenuItems } from '../get-menu-items';
import { MenuI18nKey } from '@/src/constants/i18n';

describe('Utils :: menu items :: getActualMenuItems', () => {
  test('Should return all groups', () => {
    const res = getActualMenuItems(
      [
        { key: 'A1', items: [{ key: 'i18n.Models' }, { key: 'Models' }, { key: 'i18n.Application' }] as any[] },
        { key: 'A2', items: [{ key: 'i18n.Roles' }, { key: 'i18n.Keys' }] as any[] },
        { key: MenuI18nKey.MLOps, items: [] as any[] },
      ],
      ['Roles'],
      [{ key: 'mlops-app', slug: '/mlops', name: 'MLOps App' }],
    );

    expect(res).toEqual([
      { key: 'A1', items: [{ key: 'i18n.Models' }, { key: 'Models' }, { key: 'i18n.Application' }] as any[] },
      { key: 'A2', items: [{ key: 'i18n.Roles' }, { key: 'i18n.Keys' }] as any[] },
      {
        key: MenuI18nKey.MLOps,
        items: [
          {
            href: '/mlops',
            key: 'mlops-app',
          },
        ] as any[],
      },
    ]);
  });
});

describe('Utils :: menu items :: getMenuItems', () => {
  test('Should return empty array', () => {
    const res = getMenuItems();

    expect(res).toEqual([]);
  });

  test('Should return array', () => {
    const res = getMenuItems('aaa bbb');

    expect(res).toEqual(['aaa', 'bbb']);
  });
});
