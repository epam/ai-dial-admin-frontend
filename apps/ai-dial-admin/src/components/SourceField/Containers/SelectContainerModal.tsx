import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC, useState } from 'react';

import { RADIO_BUTTON_COL_DEF } from '@/src/constants/ag-grid';
import { SOURCE_CONTAINERS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Container } from '@/src/models/deployments';

import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import Grid from '@/src/components/Grid/Grid';

interface Props {
  selectedId?: string;
  interceptorContainers?: Container[];
  isModalOpen: boolean;
  onClose: () => void;
  onApply: (id?: string) => void;
}

const SelectContainerModal: FC<Props> = ({ selectedId, interceptorContainers, isModalOpen, onClose, onApply }) => {
  const t = useI18n();

  const [selectedContainer, setSelectedContainer] = useState(selectedId);

  return (
    <DialFormPopup
      onClose={onClose}
      title={t(CreateI18nKey.SelectContainer)}
      portalId="SelectContainer"
      open={isModalOpen}
      size={PopupSize.Lg}
      cssClass="h-[750px]"
      onSubmit={() => onApply(selectedContainer)}
      disableSubmitButton={!selectedContainer}
      submitLabel={t(ButtonsI18nKey.Apply)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onCancel={onClose}
    >
      <div className="flex flex-col px-6 py-4 h-full">
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
    </DialFormPopup>
  );
};

export default SelectContainerModal;
