import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { RowDragEvent } from 'ag-grid-community';

import { getApplicationScheme } from '@/src/app/[lang]/application-runners/actions';
import { getProperties } from '@/src/app/[lang]/system-properties/actions';
import AddEntitiesGrid from '@/src/components/EntityView/AddEntitiesGrid';
import GridView from '@/src/components/Grid/GridView/GridView';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { DESCRIPTION_COLUMN, DISPLAY_NAME_COLUMN } from '@/src/constants/grid-columns/base-columns';
import { ButtonsI18nKey, EntitiesI18nKey, InterceptorsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialApplication } from '@/src/models/dial/application';
import { getSchemaSourceId } from '@/src/utils/entities/application-source';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';
import { hasConfigEntityOrigin } from '@/src/utils/config-entities/source-column';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import CollapsableInterceptors from './CollapsableInterceptors';
import { getInterceptorsColumnDefs, getInterceptorsGridData } from './utils';

interface Props<T> {
  entity: T;
  interceptors: DialInterceptor[];
  onChangeEntity: (entity: T) => void;
  view: ApplicationRoute;
  /**
   * Supplied by surfaces that resolve the global chain themselves — Core-direct ones, which must not
   * reach the admin backend. When omitted, this component fetches it from the admin backend as before.
   */
  globalInterceptors?: string[];
}

const EntityInterceptors = <T extends { interceptors?: string[]; 'dial:applicationTypeInterceptors'?: string[] }>({
  entity,
  interceptors,
  onChangeEntity,
  view,
  globalInterceptors: providedGlobalInterceptors,
}: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const [availableInterceptors, setAvailableInterceptors] = useState<DialInterceptor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [runnerInterceptors, setRunnerInterceptors] = useState<string[]>();
  const [globalInterceptors, setGlobalInterceptors] = useState<string[] | null>(providedGlobalInterceptors ?? null);

  const isCollapsableView = useMemo(() => {
    return (
      view === ApplicationRoute.Models ||
      view === ApplicationRoute.Applications ||
      view === ApplicationRoute.ApplicationRunners ||
      view === ApplicationRoute.AssetsAppRunners ||
      view === ApplicationRoute.AssetsApplications
    );
  }, [view]);

  // Both runner surfaces hold their selection in `dial:applicationTypeInterceptors`. Missing the asset
  // route here reads and writes `interceptors` instead, which Core stores verbatim — permanently.
  const isAppRunnerView = useMemo(() => {
    return view === ApplicationRoute.ApplicationRunners || view === ApplicationRoute.AssetsAppRunners;
  }, [view]);

  const entityInterceptors = useMemo(() => {
    return isAppRunnerView ? entity['dial:applicationTypeInterceptors'] : entity.interceptors;
  }, [entity, isAppRunnerView]);

  const interceptorsRef = useRef(entityInterceptors);

  useEffect(() => {
    interceptorsRef.current = entityInterceptors;
  }, [entityInterceptors]);

  useEffect(() => {
    const name = getSchemaSourceId((entity as DialApplication).source);
    if (name && !runnerInterceptors) {
      getApplicationScheme(name, DEFAULT_ETAG).then((res) => {
        setRunnerInterceptors(res.response?.['dial:applicationTypeInterceptors']);
      });
    }
  }, [entity, runnerInterceptors]);

  // Two mechanisms on purpose: the state initializer avoids a first paint that reports zero globals,
  // and this effect adopts a chain that arrives or changes after mount. Neither covers both cases.
  useEffect(() => {
    if (providedGlobalInterceptors) {
      setGlobalInterceptors(providedGlobalInterceptors);
      return;
    }
    if (!globalInterceptors) {
      getProperties(DEFAULT_ETAG).then((res) => {
        setGlobalInterceptors(res.response?.globalInterceptors || []);
      });
    }
  }, [entity, globalInterceptors, providedGlobalInterceptors, runnerInterceptors]);

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

  // Rows read from Core carry a Core reference in `name`, and `getEntityPath` has no case for
  // interceptors, so its default branch would build an admin-BE URL for an entity that service need
  // not hold at all. Offer the link only on surfaces whose rows came from the admin backend.
  const onOpen = useMemo(
    () =>
      hasConfigEntityOrigin(interceptors)
        ? void 0
        : (interceptor?: DialInterceptor) => {
            onOpenInNewTab(ApplicationRoute.Interceptors, interceptor);
          },
    [interceptors],
  );

  const rowData = getInterceptorsGridData(interceptors, entityInterceptors);

  const globalColumns = getInterceptorsColumnDefs(onOpen);

  const runnerColumns = getInterceptorsColumnDefs(onOpen, void 0, globalInterceptors?.length);

  const onRemoveInterceptor = useCallback(
    (_?: DialInterceptor, index?: number) => {
      if (index != null) {
        const interceptors = [...(interceptorsRef.current || [])];
        interceptors.splice(index, 1);

        if (isAppRunnerView) {
          onChangeEntity({
            ...entity,
            'dial:applicationTypeInterceptors': interceptors,
          });
        } else {
          onChangeEntity({
            ...entity,
            interceptors,
          });
        }
      }
    },
    [entity, isAppRunnerView, onChangeEntity],
  );

  const localColumns = useMemo(() => {
    return getInterceptorsColumnDefs(
      onOpen,
      isReadOnlyAdmin ? undefined : onRemoveInterceptor,
      (globalInterceptors?.length || 0) + (runnerInterceptors?.length || 0),
      rowData,
    );
  }, [onOpen, onRemoveInterceptor, globalInterceptors?.length, isReadOnlyAdmin, runnerInterceptors?.length, rowData]);

  const additionalGridOptions = useMemo(() => {
    return isReadOnlyAdmin ? undefined : { rowDragManaged: true, onRowDragEnd };
  }, [onRowDragEnd, isReadOnlyAdmin]);

  const button = isReadOnlyAdmin ? null : (
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
          selectedInterceptors={entityInterceptors}
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
      {!isReadOnlyAdmin &&
        isModalOpen &&
        createPortal(
          <AddEntitiesGrid
            modalTitle={t(InterceptorsI18nKey.Add)}
            emptyTitle={t(EntitiesI18nKey.NoInterceptors)}
            isModalOpen={isModalOpen}
            entities={availableInterceptors}
            onClose={() => setIsModalOpen(false)}
            onApply={onAddInterceptors}
            columnDefs={[DISPLAY_NAME_COLUMN, DESCRIPTION_COLUMN]}
          />,
          document.body,
        )}
    </>
  );
};

export default EntityInterceptors;
