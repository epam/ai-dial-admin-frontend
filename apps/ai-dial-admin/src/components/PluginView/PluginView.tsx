'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import NoData from '@/src/components/Common/NoData/NoData';
import { BasicI18nKey } from '@/src/constants/i18n';
import FrameRenderer from '@/src/components/FrameRenderer/FrameRenderer';
import { useSession } from 'next-auth/react';
import { UserSession } from '@/src/models/auth';
import { useTheme } from '@/src/context/ThemeContext';
import { FrameConfig } from '@/src/models/frame-config';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { VisualizerConnectorEvents, VisualizerConnectorRequest } from '@epam/ai-dial-shared';

interface Props {
  slug: string;
}

const PluginView: FC<Props> = ({ slug }) => {
  const t = useI18n();
  const { data } = useSession();
  const { currentTheme } = useTheme();
  const { embeddedApps } = useAppContext();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  function extractRoute(slug: string, path: string): string {
    const index = path.indexOf(slug);
    if (index !== -1) {
      return path.slice(index);
    }
    return slug;
  }

  const generateTargetUrl = useCallback(() => {
    let route = extractRoute(slug, pathname);

    const params = Array.from(searchParams.entries());
    if (params.length) {
      const searchString = params
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      route += `?${searchString}`;
    }

    try {
      const baseUrl = new URL(frameConfig?.host ?? '');
      baseUrl.searchParams.set('authProvider', frameConfig?.providerId ?? '');
      baseUrl.searchParams.set('theme', frameConfig?.theme ?? '');
      baseUrl.searchParams.set('route', route);

      return baseUrl;
    } catch (error) {
      if (error) {
        setError(true);
      }
    }
  }, [frameConfig?.host, frameConfig?.providerId, frameConfig?.theme, pathname, searchParams, slug]);

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
