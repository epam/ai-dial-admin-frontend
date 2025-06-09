import { formatNumberWithExponent, formatNumberByDelimiter } from '@/src/utils/formatting/number-formatting';

describe('Utils :: formatting :: formatNumber', () => {
  it('Should correctly handle thousands number', () => {
    const res = formatNumberWithExponent(135000);

    expect(res).toBe('135 K');
  });

  it('Should correctly handle hundreds number', () => {
    const res = formatNumberWithExponent(123);

    expect(res).toBe('123');
  });

  it('Should correctly handle million number and round to 1 sign', () => {
    const res = formatNumberWithExponent(13650000);

    expect(res).toBe('13.7 M');
  });
});

describe('Utils ::formatting :: formatNumberByDelimiter', () => {
  it('Should return empty string', () => {
    const result1 = formatNumberByDelimiter(void 0);
    const result2 = formatNumberByDelimiter(NaN);
    expect(result1).toBe('');
    expect(result2).toBe('');
  });

  it('Should return formatted number', () => {
    const result = formatNumberByDelimiter(4444444.9998321, ' ');
    expect(result).toBe('4 444 445.00');
  });

  it('Should return formatted negative number', () => {
    const result = formatNumberByDelimiter(-4444444.9998321, ' ');
    expect(result).toBe('-4 444 445.00');
  });


  it('Should return formatted string', () => {
    const result = formatNumberByDelimiter('4444444.2228321');
    expect(result).toBe('4,444,444.22');
  });
});
