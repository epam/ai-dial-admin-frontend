import { toRadioItems } from '@/src/utils/radio-items';

describe('toRadioItems', () => {
  it('maps id to value and name to label', () => {
    expect(toRadioItems([{ id: 'a', name: 'Alpha' }])).toEqual([
      { value: 'a', label: 'Alpha', content: undefined, caption: undefined },
    ]);
  });

  it('passes content and a string caption through', () => {
    const content = 'extra';
    expect(toRadioItems([{ id: 'a', name: 'Alpha', content, caption: 'hint' }])).toEqual([
      { value: 'a', label: 'Alpha', content, caption: 'hint' },
    ]);
  });

  it('drops a non-string caption', () => {
    const [item] = toRadioItems([{ id: 'a', name: 'Alpha', caption: 42 }]);
    expect(item.caption).toBeUndefined();
  });

  it('keeps order and returns an empty array for no buttons', () => {
    expect(
      toRadioItems([
        { id: 'b', name: 'B' },
        { id: 'a', name: 'A' },
      ]).map((i) => i.value),
    ).toEqual(['b', 'a']);
    expect(toRadioItems([])).toEqual([]);
  });
});
