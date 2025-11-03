import { ALL_ID } from '@/src/constants/dial-base-entity';
import { BasicI18nKey } from '@/src/constants/i18n';
import { SelectCellRendererParams } from './SelectCellRenderer';
import { SelectOption } from '@epam/ai-dial-ui-kit';

export const getItems = (
  params: SelectCellRendererParams,
  t: (s: string) => string,
): { items?: SelectOption[]; allItemsCount?: number } => {
  const items = params.getItems?.(params.data) || params.items;
  const allItemsCount = items?.length;

  if (params.isMulti && items && items?.length > 1) {
    items.unshift({
      value: ALL_ID,
      label: t(BasicI18nKey.SelectAll),
    });
  }

  return {
    items,
    allItemsCount,
  };
};
