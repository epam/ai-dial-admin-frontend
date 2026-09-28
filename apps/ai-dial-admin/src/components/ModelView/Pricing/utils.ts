import { ModelViewI18nKey } from '@/src/constants/i18n';
import { PricingRate, PricingRateNode } from '@/src/models/dial/model';

/**
 * Helper to correctly multiple small values
 *
 * @param {(string | undefined)} value - value to multiply
 * @param {boolean} isTokenType - boolean allowing make multiply
 * @returns {string} - multiplied string
 */
export const getMultipliedValue = (value: string | undefined, isTokenType: boolean): string => {
  if (isTokenType && value && value !== '0') {
    let scaledValue = Number(value) * 1000000;
    scaledValue = parseFloat(scaledValue.toFixed(6));

    return scaledValue.toString();
  }

  return (value || '').toString();
};

/**
 * Helper to correctly multiple small values
 *
 * @param {(string | undefined)} value - value to multiply
 * @param {boolean} isTokenType - boolean allowing make multiply
 * @returns {string | number | undefined} - multiplied string
 */
export const getPriceRealValue = (value?: number | string, isTokenType?: boolean): string | undefined => {
  if (value != null && value !== 0) {
    return isTokenType ? (Number(value) / 1000000).toString() : value.toString();
  }
  return value === 0 ? '0' : void 0;
};

type LeafMapper = (rate: string) => string | undefined;

// Rebuilds a PricingRate with `map` applied to every flat leaf. A branch whose mapped value is
// undefined is omitted, which is how an emptied branch stays absent on the wire (Core reads an
// omitted branch as "fall back to the prompt rate").
const mapRateLeaves = (value: PricingRate | undefined, map: LeafMapper): PricingRate | undefined => {
  if (value == null) {
    return void 0;
  }
  if (typeof value === 'string') {
    return map(value);
  }

  const node: PricingRateNode = { test: value.test };
  const ifTrue = mapRateLeaves(value.ifTrue, map);
  const ifFalse = mapRateLeaves(value.ifFalse, map);
  if (ifTrue !== void 0) {
    node.ifTrue = ifTrue;
  }
  if (ifFalse !== void 0) {
    node.ifFalse = ifFalse;
  }
  return node;
};

/**
 * Display-side scaling for a flat-or-tree cache rate: multiplies every leaf rate per million under
 * the token unit, keeping empty leaves as '' so the inputs render empty rather than vanishing.
 */
export const getMultipliedRate = (value: PricingRate | undefined, isTokenType: boolean): PricingRate | undefined =>
  mapRateLeaves(value, (rate) => getMultipliedValue(rate, isTokenType));

/**
 * Store-side scaling for a flat-or-tree cache rate: divides every leaf rate back to per-token, and
 * omits a branch the user left empty so it is not persisted as '' or '0'.
 */
export const getRealRate = (value: PricingRate | undefined, isTokenType: boolean): PricingRate | undefined =>
  mapRateLeaves(value, (rate) => (rate === '' ? void 0 : getPriceRealValue(rate, isTokenType)));

/**
 * Formats a flat-or-tree cache rate as a readable one-line conditional, leaf rates scaled per
 * million under the token unit — e.g. `ttl == 1h ? 6 : 3.75`, nested trees parenthesised, and an
 * omitted branch shown as the prompt-rate fallback it means.
 */
export const formatPricingRate = (
  value: PricingRate | undefined,
  isToken: boolean,
  t: (str: string) => string,
): string => {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return getMultipliedValue(value, isToken);
  }

  const formatBranch = (branch: PricingRate | undefined): string => {
    if (branch == null || branch === '') {
      return t(ModelViewI18nKey.PromptRate);
    }
    return typeof branch === 'string'
      ? getMultipliedValue(branch, isToken)
      : `(${formatPricingRate(branch, isToken, t)})`;
  };

  const { test } = value;
  return `${test.field} ${test.operator} ${test.value} ? ${formatBranch(value.ifTrue)} : ${formatBranch(value.ifFalse)}`;
};
