import { getActualMenuItems, getMenuItems } from '../get-menu-items';

describe('Utils :: menu items :: getActualMenuItems', () => {
  it('Should return all groups', () => {
    const res = getActualMenuItems(
      [
        { key: 'A1', items: [{ key: 'i18n.Models' }, { key: 'i18n.Application' }] as any[] },
        { key: 'A2', items: [{ key: 'i18n.Roles' }, { key: 'i18n.Keys' }] as any[] },
      ],
      ['Roles'],
    );

    expect(res).toEqual([
      { key: 'A1', items: [{ key: 'i18n.Models' }, { key: 'i18n.Application' }] as any[] },
      { key: 'A2', items: [{ key: 'i18n.Roles' }, { key: 'i18n.Keys' }] as any[] },
    ]);
  });
});

describe('Utils :: menu items :: getMenuItems', () => {
  it('Should return empty array', () => {
    const res = getMenuItems();

    expect(res).toEqual([]);
  });

  it('Should return array', () => {
    const res = getMenuItems('aaa bbb');

    expect(res).toEqual(['aaa', 'bbb']);
  });
});
