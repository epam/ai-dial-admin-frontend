import { DefaultsValue } from '@/src/models/dial/defaults';
import { BooleanType } from '@/src/types/boolean';
import { DefaultItemType } from './types';

/**
 * Converts Defaults into array of key value
 *
 * @param {Record<string, DefaultsValue>} defaults - defaults values record
 * @returns {*} array of key value objects
 */
export const convertDefaultsToArray = (defaults: Record<string, DefaultsValue>) => {
  const array = Object.entries(defaults || {}).map(([key, value]) => ({
    key,
    value,
  }));
  if (array.length === 0) {
    array.push({ key: '', value: '' });
  }
  return array;
};

/**
 * Converts array of Defaults into Record
 *
 * @param {{ key: string; value: DefaultsValue }[]} defaults - array of key value objects
 * @returns {Record<string, DefaultsValue>} - record with string keys and values that can be string | number | boolean
 */
export const convertDefaultsToRecord = (
  defaults: { key: string; value: DefaultsValue }[],
): Record<string, DefaultsValue> => {
  const record: Record<string, string | number | boolean> = {};

  for (const { key, value } of defaults) {
    if (key && typeof value === 'number' ? !isNaN(value) : true) {
      record[key] = value;
    }
  }
  return record;
};

/**
 * Returns type of provided value
 *
 * @param {?DefaultsValue} [value] - value (string | number | boolean )
 * @returns {(keyof typeof DefaultItemType | null)} - type of value or null
 */
export const getDefaultValueType = (value?: DefaultsValue): keyof typeof DefaultItemType | null => {
  const type = typeof value;

  if (type === 'string' || type === 'number' || type === 'boolean') {
    return type;
  }
  return null;
};

/**
 * Generate initial value for selected type
 *
 * @param {DefaultItemType} type - type (string | number | boolean )
 * @returns {DefaultsValue} - correct type value
 */
export const getDefaultValueByType = (type: DefaultItemType): DefaultsValue | undefined => {
  switch (type) {
    case DefaultItemType.boolean:
      return false;
    case DefaultItemType.number:
      return undefined;
    default:
      return '';
  }
};

/**
 * Converts value based on selected type
 *
 * @param {?DefaultsValue} [value] - value (string | number)
 * @param {?DefaultItemType} [type] - type (string | number | boolean )
 * @returns {DefaultsValue} - correct type value
 */
export const getValueByType = (value?: DefaultsValue, type?: DefaultItemType): DefaultsValue => {
  switch (type) {
    case DefaultItemType.boolean:
      return value === BooleanType.true;
    case DefaultItemType.number:
      return Number(value);
    default:
      return value ? String(value) : '';
  }
};
