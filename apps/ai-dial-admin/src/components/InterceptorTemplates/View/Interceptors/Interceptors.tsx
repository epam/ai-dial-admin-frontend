import { FC, useCallback, useEffect, useState } from 'react';

import { EntitiesI18nKey } from '@/src/constants/i18n';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';
import { SIMPLE_ENTITY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
import { getInterceptorsList } from '@/src/app/[lang]/interceptors/actions';
import { getErrorNotification } from '@/src/utils/notification';
import { useNotification } from '@/src/context/NotificationContext';
import NoDataContent from '@/src/components/Common/NoData/NoData';
import Grid from '@/src/components/Grid/Grid';
import Page403 from '@/src/components/Page403/Page403';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

interface Props {
  interceptorList?: string[];
}

const Interceptors: FC<Props> = ({ interceptorList }) => {
  const t = useI18n() as (key: string) => string;
  const locale = useCurrentLocale();
  const { showNotification } = useNotification();

  const [interceptors, setInterceptors] = useState<DialInterceptor[]>([]);

  const onOpen = useCallback(
    (interceptor: DialInterceptor) => {
      onOpenInNewTab(locale, ApplicationRoute.Interceptors, interceptor);
    },
    [locale],
  );

  const colDefs = [...SIMPLE_ENTITY_COLUMNS, ACTION_COLUMN([getOpenInNewTabOperation(onOpen)])];

  useEffect(() => {
    const fetchInterceptors = async () => {
      const data = await getInterceptorsList();
      if (data === void 0) {
        return <Page403 />;
      }
      setInterceptors(data?.filter((interceptor) => interceptorList?.includes(interceptor?.name as string)) || []);
    };

    fetchInterceptors().catch((error) => {
      showNotification(getErrorNotification(error?.message));
    });
  }, [interceptorList, showNotification]);

  return (
    <>
      {!interceptorList?.length || !interceptors.length ? (
        <NoDataContent emptyDataTitle={t(EntitiesI18nKey.NoInterceptors)} />
      ) : (
        <Grid columnDefs={colDefs} rowData={interceptors} />
      )}
    </>
  );
};

export default Interceptors;
