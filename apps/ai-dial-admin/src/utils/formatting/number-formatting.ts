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

const SIGNIFICANT_DIGITS = 2;
// At and above one unit, two significant digits would report 19.74 as 20 and switch to exponential
// notation past two integer digits; the compact formatter reads better and keeps the leading digits.
const SIGNIFICANT_COMPACT_THRESHOLD = 1;

// Only meaningful after a decimal point: on an integer it would turn 20 into 2.
const stripTrailingZeros = (text: string): string =>
  text.includes('.') ? text.replace(/0+$/, '').replace(/\.$/, '') : text;

export const formatSignificantNumber = (value: number | string): string => {
  if (value === '' || value == null || isNaN(+value) || !isFinite(+value)) {
    return '';
  }

  const amount = new Big(+value);
  if (amount.eq(0)) {
    return '0';
  }

  const sign = amount.lt(0) ? '-' : '';
  const absAmount = amount.abs();

  // At and above one unit, the compact formatter is currency-agnostic and already reads better.
  if (absAmount.gte(SIGNIFICANT_COMPACT_THRESHOLD)) {
    return `${sign}${formatNumberWithExponent(absAmount.toNumber())}`;
  }

  // Sub-unit values need significant digits, not decimal places, to stay legible across orders of
  // magnitude. Deriving the scale from Big's own exponent keeps it from switching to exponential
  // notation below 1e-7, which is what toPrecision would do.
  const decimals = -absAmount.e + SIGNIFICANT_DIGITS - 1;
  return `${sign}${stripTrailingZeros(absAmount.toFixed(decimals))}`;
};
