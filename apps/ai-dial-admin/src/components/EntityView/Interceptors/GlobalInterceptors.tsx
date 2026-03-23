import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { RowDragEvent } from 'ag-grid-community';

import AddEntitiesGrid from '@/src/components/EntityView/AddEntitiesGrid';
import { DESCRIPTION_COLUMN, DISPLAY_NAME_COLUMN, NAME_COLUMN } from '@/src/constants/grid-columns/base-columns';
import { ButtonsI18nKey, EntitiesI18nKey, InterceptorsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import GridView from '@/src/components/Grid/GridView/GridView';
import { getInterceptorsColumnDefs } from './utils';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';

interface Props {
  interceptors: DialInterceptor[];
  currentInterceptors: string[];
  onChangeInterceptors: (interceptors: string[]) => void;
}

const GlobalInterceptors: FC<Props> = ({ interceptors, currentInterceptors, onChangeInterceptors }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const [availableInterceptors, setAvailableInterceptors] = useState<DialInterceptor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const globalInterceptors = useMemo(() => {
    return (
      currentInterceptors.map(
        (name) => interceptors.find((interceptor) => interceptor.name === name) as DialInterceptor,
      ) || []
    );
  }, [currentInterceptors, interceptors]);

  useEffect(() => {
    setAvailableInterceptors(
      interceptors.filter((interceptor) => !currentInterceptors.includes(interceptor.name as string)) || [],
    );
  }, [currentInterceptors, interceptors]);

  const onAddInterceptors = useCallback(
    (newInterceptors: DialInterceptor[]) => {
      onChangeInterceptors([
        ...currentInterceptors,
        ...(newInterceptors.map((interceptor) => interceptor.name as string) || []),
      ]);

      setIsModalOpen(false);
    },
    [onChangeInterceptors, currentInterceptors],
  );

  const onRemoveInterceptor = useCallback(
    (_?: DialInterceptor, index?: number) => {
      if (index != null) {
        globalInterceptors?.splice(index, 1);
        onChangeInterceptors(globalInterceptors.map((interceptor) => interceptor?.name as string));
      }
    },
    [onChangeInterceptors, globalInterceptors],
  );

  const onRowDragEnd = useCallback(
    (event: RowDragEvent) => {
      const newRowData: string[] = [];
      event.api.forEachNode((node) => newRowData.push(node.data.name));
      onChangeInterceptors(newRowData);
    },
    [onChangeInterceptors],
  );

  const onOpen = (interceptor?: DialInterceptor) => {
    onOpenInNewTab(ApplicationRoute.Interceptors, interceptor);
  };

  const rowData = globalInterceptors;

  const columns = useMemo(() => {
    return getInterceptorsColumnDefs(onOpen, isReadOnlyAdmin ? void 0 : onRemoveInterceptor);
  }, [onRemoveInterceptor, isReadOnlyAdmin]);

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
      emptyDataProps={{ title: t(EntitiesI18nKey.NoGlobalInterceptors) }}
      columnDefs={columns}
      rowData={rowData}
      additionalGridOptions={additionalGridOptions}
    />
  );

  return (
    <>
      <div className="h-full flex flex-col pt-3">
        <div className="mb-4 flex flex-row items-center justify-between">
          <h1>
            {t(TabsI18nKey.GlobalInterceptors)}: {globalInterceptors?.length || 0}
          </h1>
          {!isReadOnlyAdmin && button}
        </div>
        {localInterceptors}
      </div>
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

export default GlobalInterceptors;
