import { IconPlus } from '@tabler/icons-react';
import { RowDragEvent } from 'ag-grid-community';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import Button from '@/src/components/Common/Button/Button';
import NoDataContent from '@/src/components/Common/NoData/NoData';
import AddEntitiesGrid from '@/src/components/EntityView/AddEntitiesGrid';
import Grid from '@/src/components/Grid/Grid';
import { ButtonsI18nKey, EntitiesI18nKey, InterceptorsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { getInterceptorsColumnDefs, getInterceptorsGridData } from './utils';

interface Props<T> {
  entity: T;
  interceptors: DialInterceptor[];
  onChangeEntity: (entity: T) => void;
}

const EntityInterceptors = <T extends { interceptors: string[] }>({
  entity,
  interceptors,
  onChangeEntity,
}: Props<T>) => {
  const t = useI18n();
  const rowData = getInterceptorsGridData(interceptors, entity.interceptors);
  const [availableInterceptors, setAvailableInterceptors] = useState<DialInterceptor[]>([]);
  const [addModalState, setAddModalState] = useState(PopUpState.Closed);

  useEffect(() => {
    setAvailableInterceptors(interceptors);
  }, [entity, interceptors]);

  const onAddInterceptors = useCallback(
    (interceptors: DialInterceptor[]) => {
      onChangeEntity({
        ...entity,
        interceptors: [...(entity.interceptors || []), ...interceptors.map((i) => i.name as string)],
      });
      setAddModalState(PopUpState.Closed);
    },
    [entity, onChangeEntity, setAddModalState],
  );

  const onRemoveInterceptor = useCallback(
    (_: DialInterceptor, index: number) => {
      entity.interceptors?.splice(index, 1);
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
    setAddModalState(PopUpState.Opened);
  }, [setAddModalState]);

  const onCloseAddModal = useCallback(() => {
    setAddModalState(PopUpState.Closed);
  }, [setAddModalState]);

  const onOpen = (interceptor: DialInterceptor) => {
    onOpenInNewTab(ApplicationRoute.Interceptors, interceptor);
  };

  const columns = getInterceptorsColumnDefs(onRemoveInterceptor, onOpen);

  return (
    <div className="h-full flex flex-col pt-3">
      <div className="mb-4 flex flex-row items-center justify-between">
        <h1>
          {t(TabsI18nKey.Interceptors)}: {entity.interceptors?.length}
        </h1>
        <Button
          cssClass="primary"
          iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
          title={t(ButtonsI18nKey.Add)}
          onClick={onOpenAddModal}
        />
      </div>
      {!entity.interceptors?.length ? (
        <NoDataContent emptyDataTitle={t(EntitiesI18nKey.NoInterceptors)} />
      ) : (
        <Grid columnDefs={columns} rowData={rowData} additionalGridOptions={{ rowDragManaged: true, onRowDragEnd }} />
      )}
      {addModalState === PopUpState.Opened &&
        createPortal(
          <AddEntitiesGrid
            modalTitle={t(InterceptorsI18nKey.Add)}
            emptyTitle={t(EntitiesI18nKey.NoInterceptors)}
            modalState={addModalState}
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
