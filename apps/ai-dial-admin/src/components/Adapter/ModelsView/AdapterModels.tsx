import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { getModelsListAction } from '@/src/app/[lang]/models/actions';
import AddEntitiesView from '@/src/components/AddEntitiesTab/AddEntitiesView';
import { getRelevantModelsForAdapter } from '@/src/components/AddEntitiesTab/utils';
import { BASE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialModel } from '@/src/models/dial/model';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { getErrorNotification } from '@/src/utils/notification';

interface Props {
  adapter: DialAdapter;
  onChangeAdapter: (adapter: DialAdapter) => void;
}

const AdapterModels: FC<Props> = ({ adapter, onChangeAdapter }) => {
  const t = useI18n();
  const getReqRef = useRef(useProtectedRequest());
  const showNotificationRef = useRef(useNotification().showNotification);

  const [models, setModels] = useState<DialModel[]>([]);

  useEffect(() => {
    getReqRef.current(getModelsListAction).then((res) => {
      if (!res || !res.success || !res.response) {
        return Promise.reject(res?.errorMessage);
      }

      if (res.success) {
        setModels(res.response || []);
      } else {
        showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [adapter]);

  const onAddModels = useCallback(
    (rows: EntitiesGridData[]) => {
      const newEntities = rows.map((row) => row.name as string);
      const newAdapter = {
        ...adapter,
        models: [...(adapter.models || []), ...newEntities],
      };
      onChangeAdapter(newAdapter);
    },
    [onChangeAdapter, adapter],
  );

  const onRemoveModel = useCallback(
    (row: EntitiesGridData) => {
      const modelToRemove = row.name as string;
      const newAdapter = {
        ...adapter,
        models: adapter.models?.filter((model) => model !== modelToRemove) ?? [],
      };
      onChangeAdapter(newAdapter);
    },
    [onChangeAdapter, adapter],
  );

  return (
    <AddEntitiesView
      viewTitle={t(TabsI18nKey.Models)}
      emptyDataTitle={t(EntitiesI18nKey.NoModels)}
      models={models}
      getRelevantDataForEntity={getRelevantModelsForAdapter.bind(this, adapter)}
      onAdd={onAddModels}
      onRemove={onRemoveModel}
      customColumns={BASE_COLUMNS}
    />
  );
};

export default AdapterModels;
