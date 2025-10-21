import { IconPlus } from '@tabler/icons-react';
import { RowDragEvent } from 'ag-grid-community';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ButtonVariant, DialButton, DialNoDataContent } from '@epam/ai-dial-ui-kit';

import AddEntitiesGrid from '@/src/components/EntityView/AddEntitiesGrid';
import Grid from '@/src/components/Grid/Grid';
import { ButtonsI18nKey, EntitiesI18nKey, InterceptorsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { getInterceptorsColumnDefs, getInterceptorsGridData } from './utils';

interface Props<T> {
  entity: T;
  interceptors: DialInterceptor[];
  onChangeEntity: (entity: T) => void;
}

const EntityInterceptors = <T extends { interceptors?: string[] }>({
  entity,
  interceptors,
  onChangeEntity,
}: Props<T>) => {
  const t = useI18n();
  const rowData = getInterceptorsGridData(interceptors, entity.interceptors);
  const [availableInterceptors, setAvailableInterceptors] = useState<DialInterceptor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
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

  const onOpenAddModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseAddModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  const onOpen = (interceptor?: DialInterceptor) => {
    onOpenInNewTab(ApplicationRoute.Interceptors, interceptor);
  };

  const columns = getInterceptorsColumnDefs(onRemoveInterceptor, onOpen);

  return (
    <div className="h-full flex flex-col pt-3">
      <div className="mb-4 flex flex-row items-center justify-between">
        <h1>
          {t(TabsI18nKey.Interceptors)}: {entity.interceptors?.length}
        </h1>
        <DialButton
          variant={ButtonVariant.Primary}
          iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
          title={t(ButtonsI18nKey.Add)}
          onClick={onOpenAddModal}
        />
      </div>
      {!entity.interceptors?.length ? (
        <DialNoDataContent title={t(EntitiesI18nKey.NoInterceptors)} />
      ) : (
        <Grid columnDefs={columns} rowData={rowData} additionalGridOptions={{ rowDragManaged: true, onRowDragEnd }} />
      )}
      {isModalOpen &&
        createPortal(
          <AddEntitiesGrid
            modalTitle={t(InterceptorsI18nKey.Add)}
            emptyTitle={t(EntitiesI18nKey.NoInterceptors)}
            isModalOpen={isModalOpen}
            entities={availableInterceptors}
            onClose={onCloseAddModal}
            onApply={onAddInterceptors}
          />,
          document.body,
        )}
    </div>
  );
};

export default EntityInterceptors;
