import { ErrorType } from '@/src/types/error-type';
import { getErrorForDescription } from '../description-error';

describe('Utils :: validations :: getErrorForDescription', () => {
  const mockT = jest.fn().mockReturnValue('Translated Text');

  it('Should return translated error', () => {
    const res = getErrorForDescription(new Array(2049).fill('a').join(), mockT);

    expect(res).toEqual({
      type: ErrorType.LENGTH,
      text: 'Translated Text',
    });
  });

  it('Should return empty error', () => {
    const res = getErrorForDescription(new Array(2049).fill('a').join());

    expect(res).toEqual({
      type: ErrorType.LENGTH,
      text: '',
    });
  });

  it('Should return empty', () => {
    const res = getErrorForDescription();

    expect(res).toBeNull();
  });
});
