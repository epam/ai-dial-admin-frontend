'use client';
import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { getAppProcessStatus, getCoreVersions } from '@/src/app/actions';
import Breadcrumbs from '@/src/components/Breadcrumbs/Breadcrumbs';
import Blackout from '@/src/components/Common/Blackout/Blackout';
import Sidebar from '@/src/components/Common/Sidebar/Sidebar';
import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import Footer from '@/src/components/Footer/Footer';
import UserMobile from '@/src/components/Header/User/UserMobile';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { AppProcessStatus } from '@/src/models/app-process-status';
import { CoreVersions } from '@/src/models/core-version';
import { getErrorNotification } from '@/src/utils/notification';
import { mergeClasses } from '@/src/utils/merge-classes';

interface Props {
  children: ReactNode;
  beVersion: string | null;
  isEnableAuth: boolean;
}

const CHECK_CORE_VERSION_INTERVAL = 60 * 1000;
const CHECK_STATUS_INTERVAL = 2 * 60 * 1000;

const Content: FC<Props> = ({ children, beVersion, isEnableAuth }) => {
  const isTabletScreen = useIsTabletScreen();
  const { sidebar } = useAppContext();
  const isBottomSidebarOpen = sidebar.show && sidebar.position === SidebarPosition.Bottom;
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
    <div className="flex flex-col flex-1 min-h-0 min-w-0 relative overflow-hidden">
      <Blackout />
      <UserMobile isEnableAuth={isEnableAuth} />
      <div className="flex flex-row flex-1 min-h-0 relative">
        <div
          className={mergeClasses(
            'h-full min-w-0 flex-1 flex flex-col px-0 md:px-6 lg:px-6 pt-6',
            isBottomSidebarOpen ? 'pb-0' : 'pb-6',
          )}
        >
          {isTabletScreen && <Breadcrumbs mobile={true} />}
          {children}
        </div>
        <Sidebar />
      </div>
      <Sidebar slot={SidebarPosition.Bottom} />
      <Footer beVersion={beVersion} coreVersions={coreVersions} onChangeCoreVersion={setCoreVersions} />
    </div>
  );
};

export default Content;
