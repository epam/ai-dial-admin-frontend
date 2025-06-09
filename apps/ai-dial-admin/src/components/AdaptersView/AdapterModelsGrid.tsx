import { FC } from 'react';

import NoDataContent from '@/src/components/Common/NoData/NoData';
import { ENTITY_BASE_COLUMNS } from '@/src/components/EntityListView/entity-list-view';
import Grid from '@/src/components/Grid/Grid';
import { ACTION_COLUMN, ACTION_COLUMN_COMPONENTS } from '@/src/constants/ag-grid';
import { EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import { getOpenInNewTabOperation } from '@/src/utils/entities/entity-operations';

interface Props {
  models: DialModel[];
}

const AdapterModelsGrid: FC<Props> = ({ models }) => {
  const t = useI18n() as (t: string) => string;

  const onOpenInNewTab = (model: DialModel) => {
    window.open(`${ApplicationRoute.Models}/${model.name}`, '_blank');
  };

  const rowData = models || [];
  const columnDefs = [...ENTITY_BASE_COLUMNS, ACTION_COLUMN([getOpenInNewTabOperation(onOpenInNewTab)])];

  return (
    <div className="h-full flex flex-col pt-3">
      <div className="mb-4 flex flex-row items-center justify-between">
        <h1>
          {t(TabsI18nKey.Models)}: {rowData.length}
        </h1>
      </div>
      {!rowData?.length ? (
        <NoDataContent emptyDataTitle={t(EntitiesI18nKey.NoModels)} />
      ) : (
        <Grid columnDefs={columnDefs} rowData={rowData} additionalGridOptions={{ ...ACTION_COLUMN_COMPONENTS }} />
      )}
    </div>
  );
};

export default AdapterModelsGrid;
