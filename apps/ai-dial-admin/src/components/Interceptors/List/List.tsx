'use client';
import { FC, ReactNode, useMemo } from 'react';

import { createInterceptor, removeInterceptor } from '@/src/app/[lang]/interceptors/actions';
import BaseEntityList from '@/src/components/EntityListView/EntityListView';
import { INTERCEPTORS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { useI18n } from '@/src/locales/client';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';
interface Props {
  data: DialInterceptor[];
  /** True when `data` came from Core's config-file population (`config-file-entity-views`), not the admin backend. */
  isConfigFileSource?: boolean;
  headerExtra?: ReactNode;
}

const InterceptorsList: FC<Props> = ({ data, isConfigFileSource, headerExtra }) => {
  const t = useI18n();
  const columns = useMemo(() => INTERCEPTORS_COLUMNS(t), [t]);

  return (
    <BaseEntityList
      baseColumns={columns}
      names={[]}
      data={data}
      route={ApplicationRoute.Interceptors}
      onCreateEntity={createInterceptor}
      onRemoveEntity={removeInterceptor}
      showColumnsButton
      isConfigFileSource={isConfigFileSource}
      headerExtra={headerExtra}
    />
  );
};

export default InterceptorsList;
