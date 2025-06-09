import { FC, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import { RUNNERS_COLUMNS } from '@/src/components/EntityListView/entity-list-view';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderer/RadioButtonRenderer';
import Grid from '@/src/components/Grid/Grid';
import { RADIO_BUTTON_COL_DEF } from '@/src/constants/ag-grid';
import { BasicI18nKey, ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { PopUpState } from '@/src/types/pop-up';

interface Props {
  selectedId?: string;
  runners?: DialApplicationScheme[];
  modalState: PopUpState;
  onClose: () => void;
  onApply: (id?: string) => void;
}

const SelectRunnerModal: FC<Props> = ({ selectedId, runners, modalState, onClose, onApply }) => {
  const t = useI18n();

  const [selectedRunner, setSelectedRunner] = useState(selectedId);

  return (
    <Popup
      onClose={onClose}
      heading={t(CreateI18nKey.RunnerName)}
      portalId="entityNameToken"
      state={modalState}
      containerClassName={'h-[750px] lg:max-w-[65%]'}
    >
      <div className="flex flex-col px-6 py-4 flex-1 min-h-0">
        <Grid
          columnDefs={RUNNERS_COLUMNS.map((col) => ({ ...col, sort: void 0 }))}
          additionalGridOptions={{
            rowSelection: { mode: 'singleRow', enableClickSelection: true },
            selectionColumnDef: {
              ...RADIO_BUTTON_COL_DEF,
              cellRenderer: (data: { data?: DialApplicationScheme; id: string }) => (
                <RadioButtonRenderer
                  inputId={data.data?.$id || data.id}
                  isChecked={data.data?.$id === selectedRunner}
                />
              ),
            },
            onRowSelected: (event) => {
              if (event.node.isSelected()) {
                setSelectedRunner(event.data.$id);
              }
            },
            onGridReady: (event) => {
              event.api?.updateGridOptions({
                columnDefs: RUNNERS_COLUMNS,
                rowData: [{ ['dial:applicationTypeDisplayName']: t(BasicI18nKey.None) }, ...(runners || [])],
              });
              event.api.forEachNode((node) => {
                if (node.data.$id === selectedRunner) {
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
          onClick={() => onApply(selectedRunner === t(BasicI18nKey.None) ? void 0 : selectedRunner)}
        />
      </div>
    </Popup>
  );
};

export default SelectRunnerModal;
