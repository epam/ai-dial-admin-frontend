import { FC, useState } from 'react';
import { ColDef } from 'ag-grid-community';

import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import Grid from '@/src/components/Grid/Grid';
import { RADIO_BUTTON_COL_DEF } from '@/src/constants/ag-grid';
import { BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { PopUpState } from '@/src/types/pop-up';
import { DialAdapter } from '@/src/models/dial/adapter';

interface Props {
  title: string;
  selectedId?: string;
  sourceEntities?: (DialApplicationScheme | DialAdapter)[];
  modalState: PopUpState;
  columns: ColDef[];
  onClose: () => void;
  onApply: (id?: string) => void;
}

const SelectSourceEntityModal: FC<Props> = ({
  title,
  selectedId,
  columns,
  sourceEntities,
  modalState,
  onClose,
  onApply,
}) => {
  const t = useI18n();

  const [selectedEntity, setSelectedEntity] = useState(selectedId);

  return (
    <Popup
      onClose={onClose}
      heading={title}
      portalId="sourceEntitySelectorModal"
      state={modalState}
      containerClassName={'h-[750px] lg:max-w-[65%]'}
    >
      <div className="flex flex-col px-6 py-4 flex-1 min-h-0">
        <Grid
          columnDefs={columns.map((col) => ({ ...col, sort: void 0 }))}
          additionalGridOptions={{
            rowSelection: { mode: 'singleRow', enableClickSelection: true },
            selectionColumnDef: {
              ...RADIO_BUTTON_COL_DEF,
              cellRenderer: (data: { data?: DialApplicationScheme | DialAdapter; id: string }) => (
                <RadioButtonRenderer
                  inputId={(data.data as DialApplicationScheme)?.$id || (data.data as DialAdapter)?.name || data.id}
                  isChecked={
                    (data.data as DialApplicationScheme)?.$id === selectedEntity ||
                    (data.data as DialAdapter)?.name === selectedEntity
                  }
                />
              ),
            },
            onRowSelected: (event) => {
              if (event.node.isSelected()) {
                setSelectedEntity(event.data.$id || event.data.name);
              }
            },
            onGridReady: (event) => {
              event.api?.updateGridOptions({
                columnDefs: columns,
                rowData: [{ ['dial:applicationTypeDisplayName']: t(BasicI18nKey.None) }, ...(sourceEntities || [])],
              });
              event.api.forEachNode((node) => {
                if (node.data.$id === selectedEntity || node.data.name === selectedEntity) {
                  node.setSelected(true);
                }
              });
            },
          }}
        />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Apply)}
          onClick={() => onApply(selectedEntity === t(BasicI18nKey.None) ? void 0 : selectedEntity)}
        />
      </div>
    </Popup>
  );
};

export default SelectSourceEntityModal;
