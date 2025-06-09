import { isChecked, isIndeterminate, isMultiSelectClickAvailable } from './dropdown.utils';
import { ALL_ID } from '@/src/constants/dial-base-entity';

describe('Dropdown :: isMultiSelectClickAvailable ', () => {
  it('Should return true when not multiselect', () => {
    const result = isMultiSelectClickAvailable(void 0, 'id', 0);
    expect(result).toBeTruthy();
  });

  it('Should return true when only one item is selected and can be changed', () => {
    const result = isMultiSelectClickAvailable(['notId'], 'id', 0);
    expect(result).toBeTruthy();
  });

  it('Should return true when more than one value are available', () => {
    const result = isMultiSelectClickAvailable(['notId', 'id'], 'id', 0);
    expect(result).toBeTruthy();
  });

  it('Should return false when no values available', () => {
    const result = isMultiSelectClickAvailable([], 'id', 0);
    expect(result).toBeFalsy();
  });

  it('Should return false when only one item is selected and can not be changed', () => {
    const result = isMultiSelectClickAvailable(['id'], 'id', 0);
    expect(result).toBeFalsy();
  });

  it('Should return false when only one item is selected and can not be changed', () => {
    const result = isMultiSelectClickAvailable(['id'], 'all', 1);
    expect(result).toBeFalsy();
  });
});

describe('Dropdown :: isChecked ', () => {
  it('Should return true ', () => {
    const result = isChecked(['1'], ALL_ID, 1);
    expect(result).toBeTruthy();
  });
  it('Should return false ', () => {
    const result = isChecked(['1'], 'id', 1);
    expect(result).toBeFalsy();
  });
  it('Should return false ', () => {
    const result = isChecked(['1'], ALL_ID, 2);
    expect(result).toBeFalsy();
  });
});

describe('Dropdown :: isIndeterminate ', () => {
  it('Should return true ', () => {
    const result = isIndeterminate(['1'], ALL_ID, 2);
    expect(result).toBeTruthy();
  });
  it('Should return false ', () => {
    const result = isIndeterminate(['1'], 'id', 2);
    expect(result).toBeFalsy();
  });
  it('Should return false ', () => {
    const result = isIndeterminate(['1'], ALL_ID, 1);
    expect(result).toBeFalsy();
  });
});
