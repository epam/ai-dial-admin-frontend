/**
 * Helper to correctly multiple small values
 *
 * @param {(string | undefined)} value - value to multiply
 * @param {boolean} isTokenType - boolean allowing make multiply
 * @returns {string} - multiplied string
 */
export const getMultipliedValue = (value: string | undefined, isTokenType: boolean): string => {
  if (isTokenType && value) {
    let scaledValue = Number(value) * 1000000;
    scaledValue = parseFloat(scaledValue.toFixed(6));

    return scaledValue.toString();
  }

  return (value || '').toString();
};
