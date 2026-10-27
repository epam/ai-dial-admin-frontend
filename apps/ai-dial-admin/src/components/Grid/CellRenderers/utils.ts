import { SelectCellRendererParams } from './SelectCellRenderer';
import { SelectOption } from '@epam/ai-dial-ui-kit';

export const getItems = (params: SelectCellRendererParams): { items?: SelectOption[]; allItemsCount?: number } => {
  const items = params.getItems?.(params.data) || params.items;
  const allItemsCount = items?.length;

  return {
    items,
    allItemsCount,
  };
};

export const formatEditableValue = (
  value: string | number,
  valueFormatter?: (value: string | number) => string,
  translatedPlaceholder?: string,
) => {
  return valueFormatter ? valueFormatter(value) : (value ?? '') !== '' ? value : translatedPlaceholder;
};

/**
 * The kit derives avatar initials from letters only, so a numeric name would show "?".
 * Returns initials from the name's digits in that case, and `undefined` to let the kit derive them.
 */
export const getAvatarInitials = (name?: string): string | undefined => {
  if (!name || /\p{L}/u.test(name)) return undefined;

  return name.replace(/[^\p{N}]/gu, '').slice(0, 2) || undefined;
};
