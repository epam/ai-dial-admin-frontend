'use client';

import { FC, useCallback, useMemo } from 'react';

import { NotificationVariant, DialNotification, DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { IconWorldStar } from '@tabler/icons-react';
import { cloneDeep } from 'lodash';

import AddEntitiesView from '@/src/components/AddEntitiesTab/AddEntitiesView';
import { getRelevantDataForInterceptor } from '@/src/components/AddEntitiesTab/utils';
import { InterceptorsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplication } from '@/src/models/dial/application';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { InterceptorStatus } from '@/src/types/interceptor-status';

interface Props {
  selectedInterceptor: DialInterceptor;
  originalInterceptor: DialInterceptor;
  models: DialModel[];
  applications: DialApplication[];
  onChange: (interceptor: DialInterceptor) => void;
}

const EntitiesTabContent: FC<Props> = ({
  selectedInterceptor,
  originalInterceptor,
  onChange,
  applications,
  models,
}) => {
  const t = useI18n();

  const showGlobalError = useMemo(() => {
    return originalInterceptor.status === InterceptorStatus.GLOBAL;
  }, [originalInterceptor.status]);

  const onAddEntities = useCallback(
    (rows: EntitiesGridData[]) => {
      const newEntities = rows.map((row) => row.name as string);
      onChange({
        ...selectedInterceptor,
        entities: [...(selectedInterceptor.entities || []), ...newEntities],
      });
    },
    [onChange, selectedInterceptor],
  );

  const onRemoveEntity = useCallback(
    (row: EntitiesGridData) => {
      const newInterceptor = cloneDeep(selectedInterceptor);
      newInterceptor.entities = newInterceptor.entities?.filter((entity) => entity !== row.name);
      onChange(newInterceptor);
    },
    [onChange, selectedInterceptor],
  );

  return showGlobalError ? (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <DialNoDataContent
          icon={<IconWorldStar strokeWidth={1} size={60} />}
          title={t(InterceptorsI18nKey.GlobalMessage)}
        />
      </div>
      <DialNotification variant={NotificationVariant.Info} message={t(InterceptorsI18nKey.GlobalAlert)} />
    </div>
  ) : (
    <AddEntitiesView
      models={models}
      applications={applications}
      onAdd={onAddEntities}
      onRemove={onRemoveEntity}
      getRelevantDataForEntity={getRelevantDataForInterceptor.bind(this, selectedInterceptor)}
    />
  );
};

export default EntitiesTabContent;
