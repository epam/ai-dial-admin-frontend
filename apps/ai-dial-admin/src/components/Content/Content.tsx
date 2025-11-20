'use client';
import { FC, ReactNode, useCallback, useEffect, useRef } from 'react';

import { getAppProcessStatus } from '@/src/app/actions';
import Breadcrumbs from '@/src/components/Breadcrumbs/Breadcrumbs';
import Blackout from '@/src/components/Common/Blackout/Blackout';
import HintSidebar from '@/src/components/Common/HintSIdebar/HintSidebar';
import Footer from '@/src/components/Footer/Footer';
import UserMobile from '@/src/components/Header/User/UserMobile';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { AppProcessStatus } from '@/src/models/app-process-status';
import { getErrorNotification } from '@/src/utils/notification';

interface Props {
  children: ReactNode;
  beVersion: string | null;
  isEnableAuth: boolean;
}

const CHECK_STATUS_INTERVAL = 2 * 60 * 1000;

const Content: FC<Props> = ({ children, beVersion, isEnableAuth }) => {
  const isTabletScreen = useIsTabletScreen();
  const showNotificationRef = useRef(useNotification().showNotification);
  const getReqRef = useRef(useProtectedRequest());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const t = useI18n();

  const checkAppStatus = useCallback((): void => {
    getReqRef.current(getAppProcessStatus).then((response) => {
      const state = response.response as AppProcessStatus;
      if (!state?.success && state.errors?.length > 0) {
        showNotificationRef.current(getErrorNotification(t(ErrorI18nKey.ServerError), state.errors.join('; ')));
      }
    });
  }, [t]);

  useEffect(() => {
    checkAppStatus();
    intervalRef.current = setInterval(() => {
      checkAppStatus();
    }, CHECK_STATUS_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkAppStatus]);

  return (
    <div className="flex-1 min-h-0 min-w-0 relative">
      <Blackout />
      <UserMobile isEnableAuth={isEnableAuth} />
      <div className="flex flex-row h-full w-full">
        <div className="h-full w-full lg:p-4 py-4 md:px-6 px-0 flex flex-col">
          {isTabletScreen && <Breadcrumbs mobile={true} />}
          {children}
        </div>
        <HintSidebar />
      </div>
      <Footer beVersion={beVersion} />
    </div>
  );
};

export default Content;
