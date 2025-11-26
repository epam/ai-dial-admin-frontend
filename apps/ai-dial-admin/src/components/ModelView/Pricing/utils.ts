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
