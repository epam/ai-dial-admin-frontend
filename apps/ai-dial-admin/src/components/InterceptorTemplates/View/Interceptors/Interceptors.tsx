import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { getInterceptorsList } from '@/src/app/[lang]/interceptors/actions';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
import { BASE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

interface Props {
  interceptorList?: string[];
}

const Interceptors: FC<Props> = ({ interceptorList }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());
  const [interceptors, setInterceptors] = useState<DialInterceptor[]>([]);

  const onOpen = useCallback((interceptor?: DialInterceptor) => {
    onOpenInNewTab(ApplicationRoute.Interceptors, interceptor);
  }, []);

  const colDefs = [...BASE_COLUMNS, ACTION_COLUMN([getOpenInNewTabOperation(onOpen)])];

  useEffect(() => {
    const fetchInterceptors = async () => {
      getReqRef.current(getInterceptorsList).then(async (res) => {
        if (res.success) {
          setInterceptors(
            (res.response as DialInterceptor[])?.filter((interceptor) =>
              interceptorList?.includes(interceptor?.name as string),
            ) || [],
          );
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    };

    fetchInterceptors();
  }, [interceptorList, showNotification]);

  return <GridView emptyDataTitle={t(EntitiesI18nKey.NoInterceptors)} columnDefs={colDefs} rowData={interceptors} />;
};

export default Interceptors;
