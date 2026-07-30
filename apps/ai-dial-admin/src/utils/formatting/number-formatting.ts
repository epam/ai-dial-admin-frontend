import { Big } from 'big.js';
import { isInteger } from 'lodash';

const EXPONENT_UNITS = ['', 'K', 'M', 'B', 'T'];

const scaleTo = (num: number, exponent: number): number => parseFloat((num / Math.pow(1000, exponent)).toFixed(1));

export const formatNumberWithExponent = (num: number): string => {
  if (num < 1000) return num.toFixed(1).replace(/\.0$/, '').toString();

  // The unit is chosen from the rounded value, not the raw one: rounding 999_999 to one decimal reaches
  // 1000, which under its own unit would read "1000 K" instead of "1 M".
  let exponent = Math.floor(Math.log10(num) / 3);
  if (scaleTo(num, exponent) >= 1000) {
    exponent += 1;
  }
  exponent = Math.min(exponent, EXPONENT_UNITS.length - 1);

  return `${scaleTo(num, exponent)} ${EXPONENT_UNITS[exponent]}`;
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
