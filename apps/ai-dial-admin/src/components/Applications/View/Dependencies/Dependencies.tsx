import { FC, useCallback, useEffect, useState } from 'react';

import GridView from '@/src/components/Grid/GridWithColumnsPanel/GridWithColumnsPanel';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getOpenInNewTabOperation, getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { TYPE_COLUMN } from '@/src/constants/grid-columns/base-columns';
import { DEPENDENCIES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, MenuI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplication } from '@/src/models/dial/application';
import { DialModel } from '@/src/models/dial/model';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import AddDependenciesButton from './AddDependenciesModal/AddDependenciesButton';
import { getDependenciesData } from './utils';

interface Props {
  application: DialApplication;
  applications: DialApplication[];
  models: DialModel[];
  onChange: (application: DialApplication) => void;
}

const Dependencies: FC<Props> = ({ application, applications, models, onChange }) => {
  const t = useI18n();
  const [rowData, setRowData] = useState<EntitiesGridData[]>([]);
  const [availableModels, setAvailableModels] = useState<DialModel[]>([]);
  const [availableApplications, setAvailableApplications] = useState<DialApplication[]>([]);

  const onAddDependency = useCallback(
    (name: string) => {
      const dependencies = application.dependencies || [];
      dependencies?.push(name);
      onChange({
        ...application,
        dependencies,
      });
    },
    [application, onChange],
  );

  const onRemoveDependency = useCallback(
    (_?: DialApplication, index?: number) => {
      if (index != null) {
        application.dependencies?.splice(index, 1);
      }
      onChange({
        ...application,
        dependencies: application.dependencies,
      });
    },
    [application, onChange],
  );

  const onOpen = (entity?: EntitiesGridData) => {
    const route = entity?.type === MenuI18nKey.Models ? ApplicationRoute.Models : ApplicationRoute.Applications;
    onOpenInNewTab(route, entity);
  };

  const columns = [
    TYPE_COLUMN(t),
    ...DEPENDENCIES_COLUMNS,
    ACTION_COLUMN([getOpenInNewTabOperation(onOpen), getRemoveOperation(onRemoveDependency)]),
  ];

  useEffect(() => {
    const { data, filteredModels, filteredApplications } = getDependenciesData(
      application.dependencies || [],
      models,
      applications,
    );
    setRowData(data);
    setAvailableModels(filteredModels);
    setAvailableApplications(filteredApplications);
  }, [applications, application, models]);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex flex-row items-center justify-between">
        <h1>
          {t(TabsI18nKey.Dependencies)}: {application.dependencies?.length || 0}
        </h1>
        <AddDependenciesButton
          availableModels={availableModels}
          availableApplications={availableApplications?.filter((a) => a.name !== application.name)}
          addDependency={onAddDependency}
        />
      </div>
      <GridView emptyDataTitle={t(EntitiesI18nKey.NoDependencies)} columnDefs={columns} rowData={rowData} />;
    </div>
  );
};

export default Dependencies;
