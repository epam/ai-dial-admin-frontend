import Big from 'big.js';
import { isInteger } from 'lodash';

export const formatNumberWithExponent = (num: number): string => {
  if (num < 1000) return num.toFixed(1).replace(/\.0$/, '').toString();

  const units = ['', 'K', 'M', 'B', 'T'];
  const exponent = Math.floor(Math.log10(num) / 3);
  const shortNumber = num / Math.pow(1000, exponent);

  return `${parseFloat(shortNumber.toFixed(1).replace(/\.0$/, ''))} ${units[exponent]}`;
};

export const formatNumberByDelimiter = (
  value: string | number | undefined,
  delimiter = ',',
  precision = '0.00',
): string => {
  if (value == null || isNaN(+value) || !isFinite(+value)) {
    return '';
  }

  const { fractionalPart, integerPart, sign } = splitNumber(value, precision);

  if (!fractionalPart) {
    const formattedIntPart = formatInt(integerPart, delimiter);
    return `${sign}${formattedIntPart}`;
  }

  const formattedIntPart = formatInt(integerPart, delimiter);

  return `${sign}${formattedIntPart}.${fractionalPart}`;
};

const precisionToNum = (precision: string): number => {
  const precisionNum = precision.replace('0.', '');
  return precision === '0' ? 0 : precisionNum.length;
};

const splitNumber = (
  value: string | number,
  precision: string,
): {
  power: string | null;
  sign: string;
  integerPart: string;
  fractionalPart: string;
} => {
  const sign = +value < 0 ? '-' : '';

  const dValue = new Big(+value);
  const precisionNum = precisionToNum(precision);
  const numericValue = isInteger(dValue.toNumber())
    ? dValue.abs()
    : dValue.abs().round(precisionNum).toFixed(precisionNum);
  const [numberPart, power] = numericValue.toString().split('e');
  const [integerPart, fractionalPart] = numberPart.split('.');
  return {
    power,
    sign,
    integerPart: getIntegerPart(integerPart),
    fractionalPart,
  };
};

const getIntegerPart = (integerPart: string): string => {
  return integerPart === '' ? '0' : integerPart;
};

function formatInt(value: string | number, delimiter: string): string {
  return (value + '').replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + delimiter);
}
