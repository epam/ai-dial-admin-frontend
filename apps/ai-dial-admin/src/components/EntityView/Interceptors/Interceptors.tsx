import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { ButtonVariant, DialButton, DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { RowDragEvent } from 'ag-grid-community';

import AddEntitiesGrid from '@/src/components/EntityView/AddEntitiesGrid';
import Grid from '@/src/components/Grid/Grid';
import { DESCRIPTION_COLUMN, DISPLAY_NAME_COLUMN, NAME_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, EntitiesI18nKey, InterceptorsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import CollapsableInterceptors from './CollapsableInterceptors';
import { getInterceptorsColumnDefs, getInterceptorsGridData } from './utils';

interface Props<T> {
  entity: T;
  interceptors: DialInterceptor[];
  onChangeEntity: (entity: T) => void;
  view: ApplicationRoute;
}

const EntityInterceptors = <T extends { interceptors?: string[] }>({
  entity,
  interceptors,
  onChangeEntity,
  view,
}: Props<T>) => {
  const t = useI18n();
  const rowData = getInterceptorsGridData(interceptors, entity.interceptors);
  const [availableInterceptors, setAvailableInterceptors] = useState<DialInterceptor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isCollapsableView = useMemo(() => {
    return view === ApplicationRoute.Models || view === ApplicationRoute.Applications;
  }, [view]);

  useEffect(() => {
    //todo recheck
    setAvailableInterceptors(interceptors);
  }, [entity, interceptors]);

  const onAddInterceptors = useCallback(
    (interceptors: DialInterceptor[]) => {
      onChangeEntity({
        ...entity,
        interceptors: [...(entity.interceptors || []), ...interceptors.map((i) => i.name as string)],
      });
      setIsModalOpen(false);
    },
    [entity, onChangeEntity, setIsModalOpen],
  );

  const onRemoveInterceptor = useCallback(
    (_?: DialInterceptor, index?: number) => {
      if (index != null) {
        entity.interceptors?.splice(index, 1);
      }

      onChangeEntity({
        ...entity,
        interceptors: entity.interceptors,
      });
    },
    [entity, onChangeEntity],
  );

  const onRowDragEnd = useCallback(
    (event: RowDragEvent) => {
      const newRowData: string[] = [];
      event.api.forEachNode((node) => newRowData.push(node.data.name));
      onChangeEntity({
        ...entity,
        interceptors: newRowData,
      });
    },
    [entity, onChangeEntity],
  );

  const onOpen = (interceptor?: DialInterceptor) => {
    onOpenInNewTab(ApplicationRoute.Interceptors, interceptor);
  };

  const columns = getInterceptorsColumnDefs(onRemoveInterceptor, onOpen);

  const additionalGridOptions = useMemo(() => {
    return { rowDragManaged: true, onRowDragEnd };
  }, [onRowDragEnd]);

  const button = (
    <DialButton
      variant={ButtonVariant.Primary}
      iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
      title={t(ButtonsI18nKey.Add)}
      onClick={() => setIsModalOpen(true)}
    />
  );

  const localInterceptors = !entity.interceptors?.length ? (
    <DialNoDataContent
      title={isCollapsableView ? t(EntitiesI18nKey.NoLocalInterceptors) : t(EntitiesI18nKey.NoInterceptors)}
    />
  ) : (
    <Grid columnDefs={columns} rowData={rowData} additionalGridOptions={additionalGridOptions} />
  );

  return (
    <>
      {isCollapsableView ? (
        <CollapsableInterceptors entity={entity} localInterceptors={localInterceptors} headerButton={button} />
      ) : (
        <div className="h-full flex flex-col pt-3">
          <div className="mb-4 flex flex-row items-center justify-between">
            <h1>
              {t(TabsI18nKey.Interceptors)}: {entity.interceptors?.length}
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
