import { ALL_ID } from '@/src/constants/dial-base-entity';
import { BasicI18nKey } from '@/src/constants/i18n';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { SelectCellRendererParams } from './SelectCellRenderer';

export const getItems = (
  params: SelectCellRendererParams,
  t: (s: string) => string,
): { items?: DropdownItemsModel[]; allItemsCount?: number } => {
  const items = params.getItems?.(params.data) || params.items;
  const allItemsCount = items?.length;

  if (params.isMulti && items && items?.length > 1) {
    items.unshift({
      id: ALL_ID,
      name: t(BasicI18nKey.SelectAll),
    });
  }

  return {
    items,
    allItemsCount,
  };
};
