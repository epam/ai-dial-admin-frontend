import { ArrayItemViewModel, StructuredObjectValue } from './types';
import { LONG_VALUE_THRESHOLD, PREVIEW_TEXT_LENGTH } from './constants';

export const isFlatStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
};

export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const safeStringify = (value: unknown, pretty = false): string => {
  try {
    return JSON.stringify(value, null, pretty ? 2 : 0);
  } catch {
    return String(value);
  }
};

export const getArrayItemText = (item: unknown): string => {
  if (typeof item === 'string') return item;
  return safeStringify(item);
};

export const createArrayItems = (value: unknown[]): ArrayItemViewModel[] => {
  return value.map((item, index) => {
    const compactText = getArrayItemText(item);
    const prettyText = typeof item === 'string' ? item : safeStringify(item, true);
    const isItemLong = compactText.length > LONG_VALUE_THRESHOLD || prettyText.length > LONG_VALUE_THRESHOLD;

    return {
      index,
      compactText,
      prettyText,
      isItemLong,
      isStructured: typeof item !== 'string',
    };
  });
};

export const createStructuredObjectValue = (value: Record<string, unknown>): StructuredObjectValue => {
  const rawText = safeStringify(value, true);
  const compact = safeStringify(value);

  return {
    displayText: compact.length > PREVIEW_TEXT_LENGTH ? `${compact.slice(0, PREVIEW_TEXT_LENGTH)}...` : compact,
    rawText,
    isLong: rawText.length > LONG_VALUE_THRESHOLD,
    typeChip: 'Object',
  };
};

export const toPrimitiveValue = (value: unknown): string => {
  if (value == null) return String(value);
  return typeof value === 'string' ? value : String(value);
};
