import { ALL_ID } from '@/src/constants/dial-base-entity';

// prevented toggle checkbox for single item in list, or unchecking 'Select All'
export const isMultiSelectClickAvailable = (multipleValues?: string[], id?: string, allItemsCount?: number) => {
  return (
    (!multipleValues || (multipleValues.length === 1 && multipleValues[0] !== id) || multipleValues.length > 1) &&
    !(id === ALL_ID && allItemsCount === multipleValues?.length)
  );
};

export const isChecked = (multipleValues?: string[], id?: string, allItemsCount?: number) =>
  id === ALL_ID && allItemsCount === multipleValues?.length;

export const isIndeterminate = (multipleValues?: string[], id?: string, allItemsCount?: number) =>
  id === ALL_ID && allItemsCount !== multipleValues?.length;
