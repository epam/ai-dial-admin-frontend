/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEqual } from 'lodash';

export const isEqualSkippingUndefined = (obj1?: Record<string, any> | null, obj2?: Record<string, any> | null) => {
  const clearedObj1 = { ...obj1 };
  clearFields(clearedObj1);
  const clearedObj2 = { ...obj2 };
  clearFields(clearedObj2);

  return isEqual(clearedObj1, clearedObj2);
};

const clearFields = (obj: Record<string, any>) => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      clearFields(obj[key]);
    }
  });
};
