'use client';

import { ConfirmationPopup, ConfirmationPopupVariant, PopupSize } from '@epam/ai-dial-ui-kit';
import { DialFile } from '@epam/ai-dial-react-file-manager';
import { ColDef } from 'ag-grid-community';
import { FC, useMemo } from 'react';

import { getFlatAssetColumns, isCostObjectView } from '@/src/components/Assets/FlatAssetGrid/columns';
import GridView from '@/src/components/Grid/GridView/GridView';
import { AssetTabsI18nKey, ButtonsI18nKey, PolicyAssignmentsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AssetSource } from '@/src/models/dial/asset-source';
import { ApplicationRoute } from '@/src/types/routes';
import { getDeleteModalDescription, getDeleteModalTitle, getGridColumns, withoutFilters } from './utils';

interface Props {
  view: ApplicationRoute;
  isOpen: boolean;
  itemsToDelete: DialFile[];
  onRemove: () => void;
  onClose: () => void;
}

/** The delete confirm for a flat platform list: the selected rows only, with no folder tree to browse. */
const DeletePlatformAssetsModal: FC<Props> = ({ view, isOpen, itemsToDelete, onRemove, onClose }) => {
  const t = useI18n();
  const columnDefs = useMemo(() => {
    const columns = getGridColumns(view, false, itemsToDelete).map(withoutFilters) as ColDef[];
    if (isCostObjectView(view)) {
      const costObject = getFlatAssetColumns(view, AssetSource.Platform, () => undefined, {
        name: t(AssetTabsI18nKey.NameColumn),
        costObject: t(PolicyAssignmentsI18nKey.CostObject),
      }).find((column) => column.colId === 'costObject');
      if (costObject) columns.push(withoutFilters(costObject) as ColDef);
    }
    return columns;
  }, [view, itemsToDelete, t]);

  return (
    <ConfirmationPopup
      header={getDeleteModalTitle(view, t, itemsToDelete.length, false)}
      open={isOpen}
      confirmLabel={t(ButtonsI18nKey.Delete)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      variant={ConfirmationPopupVariant.Danger}
      onClose={onClose}
      onConfirm={onRemove}
      size={PopupSize.Md}
      className="bg-layer-raised"
    >
      <div className="px-6 dial-small mb-6">
        <p className="text-secondary mt-2 mb-6">{getDeleteModalDescription(view, t, itemsToDelete.length, false)}</p>
        <div className="max-h-[60vh] overflow-auto">
          <GridView
            columnDefs={columnDefs}
            rowData={itemsToDelete}
            additionalGridOptions={{
              defaultColDef: { filter: false, floatingFilter: false },
              rowHeight: undefined,
              onFirstDataRendered: (params) => params.api.resetRowHeights(),
            }}
          />
        </div>
      </div>
    </ConfirmationPopup>
  );
};

export default DeletePlatformAssetsModal;
