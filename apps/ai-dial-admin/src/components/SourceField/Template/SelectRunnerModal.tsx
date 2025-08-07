import { FC, useState } from 'react';

import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { PopUpState } from '@/src/types/pop-up';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { useI18n } from '@/src/locales/client';
import { RADIO_BUTTON_COL_DEF } from '@/src/constants/ag-grid';
import { SOURCE_RUNNERS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';

import Grid from '@/src/components/Grid/Grid';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';

interface Props {
  selected?: string;
  runners?: InterceptorTemplate[];
  modalState: PopUpState;
  onClose: () => void;
  onApply: (name?: string) => void;
}

const SelectRunnerModal: FC<Props> = ({ selected, runners, modalState, onClose, onApply }) => {
  const t = useI18n();

  const [selectedRunner, setSelectedRunner] = useState(selected);

  return (
    <Popup
      onClose={onClose}
      heading={t(CreateI18nKey.CreateInterceptorTemplate)}
      portalId="SelectRunnerModal"
      state={modalState}
      containerClassName={'h-[750px] lg:max-w-[65%]'}
    >
      <div className="flex flex-col px-6 py-4 flex-1 min-h-0">
        <Grid
          columnDefs={SOURCE_RUNNERS_COLUMNS}
          additionalGridOptions={{
            rowSelection: { mode: 'singleRow', enableClickSelection: true },
            selectionColumnDef: {
              ...RADIO_BUTTON_COL_DEF,
              cellRenderer: (data: { data?: { name: string }; name: string }) => (
                <RadioButtonRenderer
                  inputId={data.data?.name || data.name}
                  isChecked={data.data?.name === selectedRunner}
                />
              ),
            },
            onRowSelected: (event) => {
              if (event.node.isSelected()) {
                setSelectedRunner(event.data.name);
              }
            },
            onGridReady: (event) => {
              event.api?.updateGridOptions({
                columnDefs: SOURCE_RUNNERS_COLUMNS,
                rowData: runners,
              });
              event.api.forEachNode((node) => {
                if (node.data.name === selectedRunner) {
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
          disable={!selectedRunner}
          onClick={() => onApply(selectedRunner)}
        />
      </div>
    </Popup>
  );
};

export default SelectRunnerModal;
