'use client';
import { FC, ReactNode, useEffect, useRef } from 'react';
import UserMobile from '@/src/components/Header/User/UserMobile';
import Breadcrumbs from '@/src/components/Breadcrumbs/Breadcrumbs';
import Footer from '@/src/components/Footer/Footer';
import Blackout from '@/src/components/Common/Blackout/Blackout';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useNotification } from '@/src/context/NotificationContext';
import { getAppProcessStatus } from '@/src/app/actions';
import { getErrorNotification } from '@/src/utils/notification';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  children: ReactNode;
  beVersion: string | null;
  isEnableAuth: boolean;
}

const CHECK_STATUS_INTERVAL = 2 * 60 * 1000;

const Content: FC<Props> = ({ children, beVersion, isEnableAuth }) => {
  const isTabletScreen = useIsTabletScreen();
  const { showNotification } = useNotification();
  const showNotificationRef = useRef(showNotification);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const t = useI18n();

  useEffect(() => {
    const checkAppStatus = (): void => {
      getAppProcessStatus().then((response) => {
        if (!response?.success && response?.errorMessage) {
          showNotificationRef.current(getErrorNotification(t(BasicI18nKey.ServerError), response?.errorMessage));
        }
      });
    };

    intervalRef.current = setInterval(() => {
      checkAppStatus();
    }, CHECK_STATUS_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [t, showNotification]);

  return (
    <div className="flex-1 min-h-0 min-w-0 relative">
      <Blackout />
      <UserMobile isEnableAuth={isEnableAuth} />
      <div className="h-full w-full lg:p-4 py-4 md:px-6 px-4 flex flex-col">
        {isTabletScreen && <Breadcrumbs mobile={true} />}
        {children}
      </div>
      <Footer beVersion={beVersion} />
    </div>
  );
};

export default Content;
