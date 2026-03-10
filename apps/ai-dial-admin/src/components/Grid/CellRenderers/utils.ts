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
