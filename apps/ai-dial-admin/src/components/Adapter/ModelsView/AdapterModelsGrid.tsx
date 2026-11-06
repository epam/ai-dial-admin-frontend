import { FC } from 'react';

import { withNameLink } from '@/src/components/Grid/columns/name-link-column';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
import { BASE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';

interface Props {
  models: DialModel[];
}

const getModelHref = (data: unknown) => (data ? getUrnForEntity(ApplicationRoute.Models, data) : undefined);

const AdapterModelsGrid: FC<Props> = ({ models }) => {
  const t = useI18n();

  const open = (model?: DialModel) => {
    onOpenInNewTab(ApplicationRoute.Models, model);
  };

  const rowData = models || [];
  const columnDefs = [
    ...withNameLink(BASE_COLUMNS, getModelHref, undefined, { isNewTab: true }),
    ACTION_COLUMN([getOpenInNewTabOperation(open)]),
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex flex-row items-center justify-between">
        <h1>
          {t(TabsI18nKey.Models)}: {rowData.length}
        </h1>
      </div>

      <GridView columnDefs={columnDefs} rowData={rowData} emptyDataProps={{ title: t(EntitiesI18nKey.NoModels) }} />
    </div>
  );
};

export default AdapterModelsGrid;
