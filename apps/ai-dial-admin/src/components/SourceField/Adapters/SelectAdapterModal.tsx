import { Popup, PopupSize } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { FC, useState } from 'react';
import { GridOptions } from 'ag-grid-community';

import { SINGLE_ROW_SELECTION } from '@/src/constants/ag-grid';
import { BASE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, CreateI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';

import GridView from '@/src/components/Grid/GridView/GridView';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';

interface Props {
  selected?: string;
  adapters?: DialAdapter[];
  isModalOpen: boolean;
  onClose: () => void;
  onApply: (name?: string) => void;
}

const SelectAdapterModal: FC<Props> = ({ selected, adapters, isModalOpen, onClose, onApply }) => {
  const t = useI18n();

  const [selectedRunner, setSelectedRunner] = useState(selected);

  const options: GridOptions = {
    ...SINGLE_ROW_SELECTION,
    selectionColumnDef: {
      ...SINGLE_ROW_SELECTION.selectionColumnDef,
      cellRenderer: (data: { data?: { name: string }; name: string }) => (
        <RadioButtonRenderer inputId={data.data?.name || data.name} isChecked={data.data?.name === selectedRunner} />
      ),
    },
    onRowSelected: (event) => {
      if (event.node.isSelected()) {
        setSelectedRunner(event.data.name);
      }
    },
  };

  return (
    <Popup
      onClose={onClose}
      header={t(CreateI18nKey.SelectAdapter)}
      portalId="SelectAdapterModal"
      open={isModalOpen}
      size={PopupSize.Lg}
      className="md:h-[750px]"
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Apply),
        isSubmitDisabled: !selectedRunner,
        onCancel: onClose,
        onSubmit: () => onApply(selectedRunner),
      })}
    >
      <div className="flex flex-col px-6 py-4 h-full">
        <GridView
          columnDefs={BASE_COLUMNS}
          rowData={adapters}
          additionalGridOptions={options}
          emptyDataProps={{ title: t(EntitiesI18nKey.NoAdapters) }}
        />
      </div>
    </Popup>
  );
};

export default SelectAdapterModal;
