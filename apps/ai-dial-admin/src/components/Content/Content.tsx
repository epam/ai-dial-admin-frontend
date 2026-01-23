'use client';
import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { getAppProcessStatus, getCoreVersions } from '@/src/app/actions';
import Breadcrumbs from '@/src/components/Breadcrumbs/Breadcrumbs';
import Blackout from '@/src/components/Common/Blackout/Blackout';
import Sidebar from '@/src/components/Common/Sidebar/Sidebar';
import Footer from '@/src/components/Footer/Footer';
import UserMobile from '@/src/components/Header/User/UserMobile';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { AppProcessStatus } from '@/src/models/app-process-status';
import { CoreVersions } from '@/src/models/core-version';
import { getErrorNotification } from '@/src/utils/notification';

interface Props {
  children: ReactNode;
  beVersion: string | null;
  isEnableAuth: boolean;
}

const CHECK_CORE_VERSION_INTERVAL = 60 * 1000;
const CHECK_STATUS_INTERVAL = 2 * 60 * 1000;

const Content: FC<Props> = ({ children, beVersion, isEnableAuth }) => {
  const isTabletScreen = useIsTabletScreen();
  const showNotificationRef = useRef(useNotification().showNotification);
  const getReqRef = useRef(useProtectedRequest());
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const versionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const t = useI18n();

  const [coreVersions, setCoreVersions] = useState<CoreVersions | undefined>();

  const checkAppStatus = useCallback((): void => {
    getReqRef.current(getAppProcessStatus).then((response) => {
      const state = response.response as AppProcessStatus;
      if (!state?.success && state.errors?.length > 0) {
        showNotificationRef.current(getErrorNotification(t(ErrorI18nKey.ServerError), state.errors.join('; ')));
      }
    });
  }, [t]);

  const checkCoreVersion = useCallback((): void => {
    getReqRef.current(getCoreVersions).then((response) => {
      setCoreVersions(response.response);
    });
  }, []);

  useEffect(() => {
    checkAppStatus();
    statusIntervalRef.current = setInterval(() => {
      checkAppStatus();
    }, CHECK_STATUS_INTERVAL);

    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, [checkAppStatus]);

  useEffect(() => {
    checkCoreVersion();
    versionIntervalRef.current = setInterval(() => {
      checkCoreVersion();
    }, CHECK_CORE_VERSION_INTERVAL);

    return () => {
      if (versionIntervalRef.current) {
        clearInterval(versionIntervalRef.current);
      }
    };
  }, [checkCoreVersion]);

  return (
    <div className="flex-1 min-h-0 min-w-0 relative">
      <Blackout />
      <UserMobile isEnableAuth={isEnableAuth} />
      <div className="flex flex-row h-full w-full relative">
        <div className="h-full min-w-0 flex-1 lg:p-6 py-6 md:px-6 px-0 flex flex-col">
          {isTabletScreen && <Breadcrumbs mobile={true} />}
          {children}
        </div>
        <Sidebar />
      </div>
      <Footer beVersion={beVersion} coreVersions={coreVersions} onChangeCoreVersion={setCoreVersions} />
    </div>
  );
};

export default Content;
