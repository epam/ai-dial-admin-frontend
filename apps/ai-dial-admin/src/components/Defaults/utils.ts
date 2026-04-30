import { BooleanType } from '@/src/types/boolean';
import { DefaultItemType } from './types';

/**
 * Converts Defaults into array of key value
 *
 * @param {Record<string, unknown>} defaults - defaults values record
 * @returns {*} array of key value objects
 */
export const convertDefaultsToArray = (defaults: Record<string, unknown>) => {
  const array = Object.entries(defaults || {}).map(([key, value]) => ({
    key,
    value,
    type: typeof value,
  }));
  if (array.length === 0) {
    array.push({ key: '', value: '', type: 'string' });
  }
  return array;
};

/**
 * Converts array of Defaults into Record
 *
 * @param {{ key: string; value: unknown }[]} defaults - array of key value objects
 * @returns {Record<string, unknown>} - record with string keys and values that can be string | number | boolean
 */
export const convertDefaultsToRecord = (
  defaults: { key: string; value: unknown; type: string }[],
): Record<string, unknown> => {
  const record: Record<string, unknown> = {};

  for (const { key, value, type } of defaults) {
    const correctValue =
      type === 'number'
        ? value != null && value !== ''
          ? Number(value)
          : undefined
        : type === 'string'
          ? String(value)
          : value;
    if (key && (typeof correctValue === 'number' ? !isNaN(correctValue) : correctValue != null)) {
      record[key] = value;
    }
  }
  return record;
};

/**
 * Returns type of provided value
 *
 * @param {?unknown} [value] - value (string | number | boolean )
 * @returns {(keyof typeof DefaultItemType | null)} - type of value or null
 */
export const getDefaultValueType = (value?: unknown): keyof typeof DefaultItemType | null => {
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
 * @returns {unknown} - correct type value
 */
export const getDefaultValueByType = (type: DefaultItemType): unknown | undefined => {
  return type === DefaultItemType.boolean ? false : '';
};

/**
 * Converts value based on selected type
 *
 * @param {?unknown} [value] - value (string | number)
 * @param {?DefaultItemType} [type] - type (string | number | boolean )
 * @returns {unknown} - correct type value
 */
export const getValueByType = (value?: unknown, type?: string): unknown => {
  switch (type) {
    case DefaultItemType.boolean:
      return value === BooleanType.true;
    case DefaultItemType.number:
      return value === '' ? '' : Number(value);
    case DefaultItemType.object:
      return value || {};
    default:
      return value || '';
  }
};
