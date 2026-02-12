import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { RowDragEvent } from 'ag-grid-community';

import { getApplicationScheme } from '@/src/app/[lang]/application-runners/actions';
import { getProperties } from '@/src/app/[lang]/system-properties/actions';
import AddEntitiesGrid from '@/src/components/EntityView/AddEntitiesGrid';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { DESCRIPTION_COLUMN, DISPLAY_NAME_COLUMN, NAME_COLUMN } from '@/src/constants/grid-columns/base-columns';
import { ButtonsI18nKey, EntitiesI18nKey, InterceptorsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialApplication } from '@/src/models/dial/application';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import GridView from '@/src/components/Grid/GridView/GridView';
import CollapsableInterceptors from './CollapsableInterceptors';
import { getInterceptorsColumnDefs, getInterceptorsGridData } from './utils';

interface Props<T> {
  entity: T;
  interceptors: DialInterceptor[];
  onChangeEntity: (entity: T) => void;
  view: ApplicationRoute;
}

const EntityInterceptors = <T extends { interceptors?: string[]; 'dial:applicationTypeInterceptors'?: string[] }>({
  entity,
  interceptors,
  onChangeEntity,
  view,
}: Props<T>) => {
  const t = useI18n();

  const [availableInterceptors, setAvailableInterceptors] = useState<DialInterceptor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [runnerInterceptors, setRunnerInterceptors] = useState<string[]>();
  const [globalInterceptors, setGlobalInterceptors] = useState<string[] | null>(null);

  const isCollapsableView = useMemo(() => {
    return (
      view === ApplicationRoute.Models ||
      view === ApplicationRoute.Applications ||
      view === ApplicationRoute.ApplicationRunners ||
      view === ApplicationRoute.AssetsApplications
    );
  }, [view]);

  const isAppRunnerView = useMemo(() => {
    return view === ApplicationRoute.ApplicationRunners;
  }, [view]);

  const entityInterceptors = useMemo(() => {
    return isAppRunnerView ? entity['dial:applicationTypeInterceptors'] : entity.interceptors;
  }, [entity, isAppRunnerView]);

  useEffect(() => {
    const name =
      (entity as DialApplication).customAppSchemaId || (entity as unknown as AssetApp).applicationTypeSchemaId;
    if (name && !runnerInterceptors) {
      getApplicationScheme(name, DEFAULT_ETAG).then((res) => {
        setRunnerInterceptors(res.response?.['dial:applicationTypeInterceptors']);
      });
    }
  }, [entity, runnerInterceptors]);

  useEffect(() => {
    if (!globalInterceptors) {
      getProperties(DEFAULT_ETAG).then((res) => {
        setGlobalInterceptors(res.response?.globalInterceptors || []);
      });
    }
  }, [entity, globalInterceptors, runnerInterceptors]);

  useEffect(() => {
    setAvailableInterceptors(interceptors);
  }, [entity, interceptors]);

  const onAddInterceptors = useCallback(
    (interceptors: DialInterceptor[]) => {
      if (isAppRunnerView) {
        onChangeEntity({
          ...entity,
          'dial:applicationTypeInterceptors': [
            ...(entityInterceptors || []),
            ...interceptors.map((i) => i.name as string),
          ],
        });
      } else {
        onChangeEntity({
          ...entity,
          interceptors: [...(entityInterceptors || []), ...interceptors.map((i) => i.name as string)],
        });
      }

      setIsModalOpen(false);
    },
    [entity, entityInterceptors, isAppRunnerView, onChangeEntity],
  );

  const onRemoveInterceptor = useCallback(
    (_?: DialInterceptor, index?: number) => {
      if (index != null) {
        entityInterceptors?.splice(index, 1);

        if (isAppRunnerView) {
          onChangeEntity({
            ...entity,
            'dial:applicationTypeInterceptors': entityInterceptors,
          });
        } else {
          onChangeEntity({
            ...entity,
            interceptors: entityInterceptors,
          });
        }
      }
    },
    [entity, entityInterceptors, isAppRunnerView, onChangeEntity],
  );

  const onRowDragEnd = useCallback(
    (event: RowDragEvent) => {
      const newRowData: string[] = [];
      event.api.forEachNode((node) => newRowData.push(node.data.name));
      if (isAppRunnerView) {
        onChangeEntity({
          ...entity,
          'dial:applicationTypeInterceptors': newRowData,
        });
      } else {
        onChangeEntity({
          ...entity,
          interceptors: newRowData,
        });
      }
    },
    [entity, isAppRunnerView, onChangeEntity],
  );

  const onOpen = (interceptor?: DialInterceptor) => {
    onOpenInNewTab(ApplicationRoute.Interceptors, interceptor);
  };

  const rowData = getInterceptorsGridData(interceptors, entityInterceptors);

  const globalColumns = getInterceptorsColumnDefs(onOpen);

  const runnerColumns = getInterceptorsColumnDefs(onOpen, void 0, globalInterceptors?.length);

  const localColumns = useMemo(() => {
    return getInterceptorsColumnDefs(
      onOpen,
      onRemoveInterceptor,
      (globalInterceptors?.length || 0) + (runnerInterceptors?.length || 0),
    );
  }, [onRemoveInterceptor, globalInterceptors?.length, runnerInterceptors?.length]);

  const additionalGridOptions = useMemo(() => {
    return { rowDragManaged: true, onRowDragEnd };
  }, [onRowDragEnd]);

  const button = (
    <DialPrimaryButton
      iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
      label={t(ButtonsI18nKey.Add)}
      onClick={() => setIsModalOpen(true)}
    />
  );

  const localInterceptors = (
    <GridView
      emptyDataProps={{
        title: isCollapsableView ? t(EntitiesI18nKey.NoLocalInterceptors) : t(EntitiesI18nKey.NoInterceptors),
      }}
      columnDefs={localColumns}
      rowData={rowData}
      additionalGridOptions={additionalGridOptions}
    />
  );

  return (
    <>
      {isCollapsableView ? (
        <CollapsableInterceptors
          entity={entity}
          interceptors={interceptors}
          globalColumns={globalColumns}
          runnerColumns={runnerColumns}
          runnerInterceptors={runnerInterceptors}
          localInterceptors={localInterceptors}
          globalInterceptors={globalInterceptors}
          headerButton={button}
        />
      ) : (
        <div className="h-full flex flex-col">
          <div className="mb-4 flex flex-row items-center justify-between">
            <h1>
              {t(TabsI18nKey.Interceptors)}: {entityInterceptors?.length || 0}
            </h1>
            {button}
          </div>
          {localInterceptors}
        </div>
      )}
      {isModalOpen &&
        createPortal(
          <AddEntitiesGrid
            modalTitle={t(InterceptorsI18nKey.Add)}
            emptyTitle={t(EntitiesI18nKey.NoInterceptors)}
            isModalOpen={isModalOpen}
            entities={availableInterceptors}
            onClose={() => setIsModalOpen(false)}
            onApply={onAddInterceptors}
            columnDefs={[DISPLAY_NAME_COLUMN, DESCRIPTION_COLUMN, NAME_COLUMN]}
          />,
          document.body,
        )}
    </>
  );
};

export default EntityInterceptors;
