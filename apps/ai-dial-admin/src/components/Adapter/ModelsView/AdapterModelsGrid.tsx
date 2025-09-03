import { FC } from 'react';

import NoDataContent from '@/src/components/Common/NoData/NoData';
import { ENTITY_BASE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import Grid from '@/src/components/Grid/Grid';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import { getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

interface Props {
  models: DialModel[];
}

const AdapterModelsGrid: FC<Props> = ({ models }) => {
  const t = useI18n() as (t: string) => string;
  const locale = useCurrentLocale();

  const open = (model: DialModel) => {
    onOpenInNewTab(locale, ApplicationRoute.Models, model.name);
  };

  const rowData = models || [];
  const columnDefs = [...ENTITY_BASE_COLUMNS, ACTION_COLUMN([getOpenInNewTabOperation(open)])];

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
        <Grid columnDefs={columnDefs} rowData={rowData} />
      )}
    </div>
  );
};

export default AdapterModelsGrid;
