import { isValueTruthy } from '../types';

describe('Utils :: isValueTruthy', () => {
  it('Should return true', () => {
    const result = isValueTruthy('true');
    expect(result).toBeTruthy();
  });

  it('Should return false', () => {
    const result = isValueTruthy('false');
    expect(result).toBeFalsy();
  });
});
