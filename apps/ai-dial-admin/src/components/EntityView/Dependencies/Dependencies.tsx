import { FC, useCallback, useEffect, useState } from 'react';

import { DialNoDataContent } from '@epam/ai-dial-ui-kit';

import Grid from '@/src/components/Grid/Grid';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getOpenInNewTabOperation, getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { DEPENDENCIES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { TYPE_COLUMN } from '@/src/constants/grid-columns/base-columns';
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
  entity: DialApplication;
  applications: DialApplication[];
  models: DialModel[];
  onChangeEntity: (entity: DialApplication) => void;
}

const EntityDependencies: FC<Props> = ({ entity, applications, models, onChangeEntity }) => {
  const t = useI18n();
  const [rowData, setRowData] = useState<EntitiesGridData[]>([]);
  const [availableModels, setAvailableModels] = useState<DialModel[]>([]);
  const [availableApplications, setAvailableApplications] = useState<DialApplication[]>([]);

  const onAddDependency = useCallback(
    (name: string) => {
      const dependencies = entity.dependencies || [];
      dependencies?.push(name);
      onChangeEntity({
        ...entity,
        dependencies,
      });
    },
    [entity, onChangeEntity],
  );

  const onRemoveDependency = useCallback(
    (_?: DialApplication, index?: number) => {
      if (index != null) {
        entity.dependencies?.splice(index, 1);
      }
      onChangeEntity({
        ...entity,
        dependencies: entity.dependencies,
      });
    },
    [entity, onChangeEntity],
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
      entity.dependencies || [],
      models,
      applications,
    );
    setRowData(data);
    setAvailableModels(filteredModels);
    setAvailableApplications(filteredApplications);
  }, [applications, entity, models]);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex flex-row items-center justify-between">
        <h1>
          {t(TabsI18nKey.Dependencies)}: {entity.dependencies?.length || 0}
        </h1>
        <AddDependenciesButton
          availableModels={availableModels}
          availableApplications={availableApplications?.filter((a) => a.name !== entity.name)}
          addDependency={onAddDependency}
        />
      </div>
      {!entity.dependencies?.length ? (
        <DialNoDataContent title={t(EntitiesI18nKey.NoDependencies)} />
      ) : (
        <Grid columnDefs={columns} rowData={rowData} />
      )}
    </div>
  );
};

export default EntityDependencies;
