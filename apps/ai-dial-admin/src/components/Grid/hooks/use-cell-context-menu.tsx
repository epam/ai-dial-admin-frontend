import { DropdownItem } from '@epam/ai-dial-ui-kit';
import { IconCopy, IconExternalLink } from '@tabler/icons-react';
import { CellContextMenuEvent } from 'ag-grid-community';
import { useCallback, useRef } from 'react';

import { ActionMenuOperationI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

/**
 * The kit grid builds its row context menu when a row renders, long before a cell is right-clicked,
 * so the clicked cell's value is captured from ag-grid's event and read lazily by the item handlers.
 */
export const useCellContextMenu = <T extends object>(getHref?: (data: unknown) => string | undefined) => {
  const t = useI18n();
  const copyValueRef = useRef('');

  const onCellContextMenu = useCallback((event: CellContextMenuEvent) => {
    const formattedValue = event.node
      ? event.api.getCellValue({ rowNode: event.node, colKey: event.column, useFormatter: true })
      : undefined;
    const displayValue = formattedValue ?? event.value;
    copyValueRef.current = displayValue != null ? String(displayValue) : '';
  }, []);

  const getContextMenuItems = useCallback(
    (row: T): DropdownItem[] => {
      const href = getHref?.(row);
      const items: DropdownItem[] = [
        {
          key: 'copy',
          label: t(ButtonsI18nKey.Copy),
          icon: <IconCopy {...BASE_BUTTON_ICON_PROPS} aria-hidden />,
          onClick: () => {
            void navigator.clipboard.writeText(copyValueRef.current);
          },
        },
      ];

      if (href) {
        items.push({
          key: 'open-in-new-tab',
          label: t(ActionMenuOperationI18nKey.Open_in_new_tab),
          icon: <IconExternalLink {...BASE_BUTTON_ICON_PROPS} aria-hidden />,
          onClick: () => {
            window.open(href, '_blank');
          },
        });
      }

      return items;
    },
    [getHref, t],
  );

  return { onCellContextMenu, getContextMenuItems };
};
