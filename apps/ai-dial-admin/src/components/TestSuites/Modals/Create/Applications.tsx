'use client';

import { FC, MouseEvent, useCallback, useState } from 'react';

import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { IconColumns2 } from '@tabler/icons-react';
import { GridOptions, RowSelectedEvent } from 'ag-grid-community';

import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import GridWithColumnsPanel from '@/src/components/Grid/GridWithColumnsPanel/GridWithColumnsPanel';
import { RADIO_BUTTON_COL_DEF } from '@/src/constants/ag-grid';
import { APPLICATIONS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialApplication } from '@/src/models/dial/application';

interface Props {
  selectedApplication?: string;
  onChange: (id: string) => void;
}

const Applications: FC<Props> = ({ selectedApplication, onChange }) => {
  const t = useI18n();

  const [showColumnsPanel, setShowColumnsPanel] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [applications, setApplications] = useState<DialApplication[]>([
    { name: 'a', applicationProperties: { name: 'App1' } },
    { name: 'b', applicationProperties: { name: 'App2' } },
  ]);

  const onRowSelected = (event: RowSelectedEvent) => {
    if (event.node.isSelected()) {
      onChange(event.data?.name || '');
    }
  };

  const additionalGridOptions: GridOptions = {
    rowSelection: {
      mode: 'singleRow',
      enableClickSelection: true,
    },
    suppressRowClickSelection: true,
    selectionColumnDef: {
      ...RADIO_BUTTON_COL_DEF,
      cellRenderer: (data: { data?: { name: string }; name: string }) => (
        <RadioButtonRenderer
          inputId={data.data?.name || data.name}
          isChecked={data.data?.name === selectedApplication}
        />
      ),
    },
    onRowSelected: onRowSelected,
  };

  const toggleColumnsPanel = useCallback(() => setShowColumnsPanel(!showColumnsPanel), [showColumnsPanel]);

  const onToggleColumnsPanel = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      toggleColumnsPanel();
    },
    [toggleColumnsPanel],
  );

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex flex-row mb-4 items-center justify-between">
        <h2 className="font-semibold">{t(MenuI18nKey.Applications)}</h2>

        <DialGhostButton
          label={t(ButtonsI18nKey.Columns)}
          iconBefore={<IconColumns2 {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onToggleColumnsPanel}
        />
      </div>

      <div className="flex-1 min-h-0">
        <GridWithColumnsPanel
          columnDefs={APPLICATIONS_COLUMNS(t)}
          data={applications}
          additionalGridOptions={{ ...additionalGridOptions }}
          emptyDataTitle={t(EntitiesI18nKey.NoApplications)}
          showColumnsPanel={showColumnsPanel}
          toggleColumnsPanel={toggleColumnsPanel}
        />
      </div>
    </div>
  );
};

export default Applications;
