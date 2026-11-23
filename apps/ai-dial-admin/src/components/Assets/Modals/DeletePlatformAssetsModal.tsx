'use client';

import { ConfirmationPopup, ConfirmationPopupVariant, PopupSize } from '@epam/ai-dial-ui-kit';
import { DialFile } from '@epam/ai-dial-react-file-manager';
import { ColDef } from 'ag-grid-community';
import { FC, useMemo } from 'react';

import GridView from '@/src/components/Grid/GridView/GridView';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
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
  const columnDefs = useMemo(
    () => getGridColumns(view, false, itemsToDelete).map(withoutFilters) as ColDef[],
    [view, itemsToDelete],
  );

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
      className="bg-layer-2"
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
