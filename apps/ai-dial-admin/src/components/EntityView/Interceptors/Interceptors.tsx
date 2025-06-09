import { RowDragEvent } from 'ag-grid-community';
import { FC, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconPlus } from '@tabler/icons-react';

import NoDataContent from '@/src/components/Common/NoData/NoData';
import Grid from '@/src/components/Grid/Grid';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { ButtonsI18nKey, EntitiesI18nKey, InterceptorsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import Button from '@/src/components/Common/Button/Button';
import { getInterceptorsColumnDefs, getInterceptorsGridData } from './interceptors-utils';
import { PopUpState } from '@/src/types/pop-up';
import { ACTIONS_COLUMN_CELL_RENDERER_KEY } from '@/src/constants/ag-grid';
import ActionColumn from '@/src/components/Grid/ActionColumn/ActionColumn';
import AddEntitiesGrid from '@/src/components/EntityView/AddEntitiesGrid';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  entity: DialBaseEntity;
  interceptors: DialBaseEntity[];
  onChangeEntity: (entity: DialBaseEntity) => void;
}

const EntityInterceptors: FC<Props> = ({ entity, interceptors, onChangeEntity }) => {
  const t = useI18n();
  const rowData = getInterceptorsGridData(interceptors, entity.interceptors);
  const [availableInterceptors, setAvailableInterceptors] = useState<DialBaseEntity[]>([]);
  const [addModalState, setAddModalState] = useState(PopUpState.Closed);

  useEffect(() => {
    setAvailableInterceptors(
      interceptors.filter((interceptor) => !entity.interceptors?.includes(interceptor.name as string)),
    );
  }, [entity, interceptors]);

  const onAddInterceptors = useCallback(
    (interceptors: DialBaseEntity[]) => {
      onChangeEntity({
        ...entity,
        interceptors: [...(entity.interceptors || []), ...interceptors.map((i) => i.name as string)],
      });
      setAddModalState(PopUpState.Closed);
    },
    [entity, onChangeEntity, setAddModalState],
  );

  const onRemoveInterceptor = useCallback(
    (interceptor: DialBaseEntity) => {
      const filtered = entity.interceptors?.filter((i) => i !== interceptor.name);
      onChangeEntity({
        ...entity,
        interceptors: filtered,
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

  const onOpenInNewTab = (interceptor: DialBaseEntity) => {
    window.open(`${ApplicationRoute.Interceptors}/${interceptor.name}`, '_blank');
  };

  const columns = getInterceptorsColumnDefs(onRemoveInterceptor, onOpenInNewTab);

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
        <Grid
          columnDefs={columns}
          rowData={rowData}
          additionalGridOptions={{
            components: { [ACTIONS_COLUMN_CELL_RENDERER_KEY]: ActionColumn },
            rowDragManaged: true,
            onRowDragEnd: onRowDragEnd,
          }}
        />
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
