import { FC, useState } from 'react';

import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { PopUpState } from '@/src/types/pop-up';
import { Container } from '@/src/models/deployments';
import { useI18n } from '@/src/locales/client';
import { RADIO_BUTTON_COL_DEF } from '@/src/constants/ag-grid';
import { SOURCE_CONTAINERS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';

import Grid from '@/src/components/Grid/Grid';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';

interface Props {
  selectedId?: string;
  interceptorContainers?: Container[];
  modalState: PopUpState;
  onClose: () => void;
  onApply: (id?: string) => void;
}

const SelectContainerModal: FC<Props> = ({ selectedId, interceptorContainers, modalState, onClose, onApply }) => {
  const t = useI18n();

  const [selectedContainer, setSelectedContainer] = useState(selectedId);

  return (
    <Popup
      onClose={onClose}
      heading={t(CreateI18nKey.SelectContainer)}
      portalId="entityNameToken"
      state={modalState}
      containerClassName={'h-[750px] lg:max-w-[65%]'}
    >
      <div className="flex flex-col px-6 py-4 flex-1 min-h-0">
        <Grid
          columnDefs={SOURCE_CONTAINERS_COLUMNS}
          additionalGridOptions={{
            rowSelection: { mode: 'singleRow', enableClickSelection: true },
            selectionColumnDef: {
              ...RADIO_BUTTON_COL_DEF,
              cellRenderer: (data: { data?: { id: string; name: string; image: string }; id: string }) => (
                <RadioButtonRenderer
                  inputId={data.data?.id || data.id}
                  isChecked={data.data?.id === selectedContainer}
                />
              ),
            },
            onRowSelected: (event) => {
              if (event.node.isSelected()) {
                setSelectedContainer(event.data.id);
              }
            },
            onGridReady: (event) => {
              event.api?.updateGridOptions({
                columnDefs: SOURCE_CONTAINERS_COLUMNS,
                rowData: interceptorContainers,
              });
              event.api.forEachNode((node) => {
                if (node.data.id === selectedContainer) {
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
          disable={!selectedContainer}
          onClick={() => onApply(selectedContainer)}
        />
      </div>
    </Popup>
  );
};

export default SelectContainerModal;
