'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import NoData from '@/src/components/Common/NoData/NoData';
import { BasicI18nKey } from '@/src/constants/i18n';
import FrameRenderer from '@/src/components/FrameRenderer/FrameRenderer';
import { useSession } from 'next-auth/react';
import { UserSession } from '@/src/models/auth';
import { useTheme } from '@/src/context/ThemeContext';
import { FrameConfig } from '@/src/components/ApplicationParametersTab/ApplicationParametersTab';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { usePathname } from 'next/navigation';
import { VisualizerConnectorEvents, VisualizerConnectorRequest } from '@epam/ai-dial-shared';
import { useRouter } from 'next/navigation';
interface Props {
  slug: string;
}

const PluginView: FC<Props> = ({ slug }) => {
  const t = useI18n();
  const { data } = useSession();
  const { currentTheme } = useTheme();
  const { embeddedApps } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();

  const session = data as UserSession;
  const plugin = embeddedApps.find((embeddedApp) => embeddedApp.slug === `/${slug}`);

  const [frameConfig, setFrameConfig] = useState<FrameConfig | null>(null);
  const [error, setError] = useState(false);

  const handleMessage = useCallback(
    (event: MessageEvent<VisualizerConnectorRequest>) => {
      if (event.data?.type?.split('/')[1] !== VisualizerConnectorEvents.sendMessage) return;
      const pathName = (event.data as { payload: { pathname: string } }).payload.pathname;
      const newTab = (event.data as { payload: { newTab: string } }).payload.newTab;

      if (pathName) {
        router.push(pathName);
      }
      if (newTab) {
        window.open(newTab, '_blank');
      }
    },
    [router],
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  useEffect(() => {
    setFrameConfig({
      theme: currentTheme,
      providerId: session?.providerId as string,
      host: plugin?.url,
      name: plugin?.name,
    });
  }, [currentTheme, plugin, session]);

  function extractCorrectRoute(slug: string, path: string): string {
    const index = path.indexOf(slug);
    if (index !== -1) {
      return path.slice(index);
    }
    return slug;
  }

  const generateTargetUrl = useCallback(() => {
    const correctRoute = extractCorrectRoute(slug, pathname);
    try {
      const iframeUrl = `${frameConfig?.host}?authProvider=${frameConfig?.providerId}&theme=${frameConfig?.theme}&route=${correctRoute}`;
      return new URL(iframeUrl);
    } catch (error) {
      if (error) {
        setError(true);
      }
    }
  }, [frameConfig?.host, frameConfig?.providerId, frameConfig?.theme, pathname, slug]);

  return (
    <div className="flex flex-col bg-layer-2 rounded p-4 flex-1 min-h-0">
      {error || !frameConfig ? (
        <NoData emptyDataTitle={t(BasicI18nKey.NoData)} />
      ) : (
        <FrameRenderer iframeUrl={generateTargetUrl()?.href ?? ''} name={frameConfig?.name} />
      )}
    </div>
  );
};

export default PluginView;
