import { getActionClass } from '@/src/utils/publications';
import { ActionType } from '@/src/models/dial/publications';

describe('Utils :: publications :: getActionClass', () => {
  it('Should correctly return action class name', () => {
    expect(getActionClass('add' as ActionType)).toBeTruthy();
    expect(getActionClass('delete' as ActionType)).toBeTruthy();
  });
});
