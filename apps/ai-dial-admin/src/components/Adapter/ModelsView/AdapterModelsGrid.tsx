import { FC } from 'react';

import GridView from '@/src/components/Grid/GridWithColumnsPanel/GridWithColumnsPanel';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
import { BASE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

interface Props {
  models: DialModel[];
}

const AdapterModelsGrid: FC<Props> = ({ models }) => {
  const t = useI18n();

  const open = (model?: DialModel) => {
    onOpenInNewTab(ApplicationRoute.Models, model?.name);
  };

  const rowData = models || [];
  const columnDefs = [...BASE_COLUMNS, ACTION_COLUMN([getOpenInNewTabOperation(open)])];

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex flex-row items-center justify-between">
        <h1>
          {t(TabsI18nKey.Models)}: {rowData.length}
        </h1>
      </div>

      <GridView columnDefs={columnDefs} rowData={rowData} emptyDataTitle={t(EntitiesI18nKey.NoModels)} />
    </div>
  );
};

export default AdapterModelsGrid;
