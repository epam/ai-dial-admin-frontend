import Big from 'big.js';

import { UNLIMITED_VALUE } from '@/src/constants/role';

export const getCorrectValue = (value?: string | boolean | null) => {
  if (!value || value === UNLIMITED_VALUE) {
    return '';
  }
  const stringValue = value.toString();
  return stringValue.startsWith('0') ? stringValue : new Big(stringValue).toFixed();
};
