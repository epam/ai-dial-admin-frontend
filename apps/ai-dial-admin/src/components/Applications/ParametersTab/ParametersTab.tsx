'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { useTheme } from '@/src/context/ThemeContext';
import { getFrameConfig, getAppRunner } from '@/src/components/Applications/ParametersTab/utils';
import FrameRenderer from '@/src/components/FrameRenderer/FrameRenderer';
import NoData from '@/src/components/Common/NoData/NoData';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { useSession } from 'next-auth/react';
import { UserSession } from '@/src/models/auth';
import { FrameConfig } from '@/src/models/frame-config';
import { DialApplicationResource } from '@/src/models/dial/application-resource';

interface Props {
  entity?: DialApplication | DialApplicationResource;
  applicationSchemes?: DialApplicationScheme[] | null;
  jsonEditorEnabled?: boolean;
}

const ApplicationParametersTab: FC<Props> = ({ entity, applicationSchemes, jsonEditorEnabled }) => {
  const t = useI18n();
  const { data: session } = useSession();
  const { currentTheme } = useTheme();
  const [error, setError] = useState(false);
  const [frameConfig, setFrameConfig] = useState<FrameConfig | null>(null);
  const scheme = getAppRunner(entity as DialApplication, applicationSchemes);

  useEffect(() => {
    if (scheme) {
      setFrameConfig(getFrameConfig(scheme, currentTheme, session as UserSession));
    }
  }, [scheme, currentTheme, session]);

  const generateTargetUrl = useCallback(() => {
    try {
      const iframeUrl = `${frameConfig?.host}?authProvider=${frameConfig?.providerId}&theme=${frameConfig?.theme}&id=${entity?.name}`;
      return new URL(iframeUrl);
    } catch (error) {
      if (error) {
        setError(true);
      }
    }
  }, [frameConfig, entity]);

  return (
    <div className="flex w-full h-full">
      {error || !frameConfig ? (
        <NoData emptyDataTitle={t(BasicI18nKey.NoParameters)} />
      ) : (
        <FrameRenderer
          iframeUrl={generateTargetUrl()?.href ?? ''}
          name={frameConfig?.name}
          jsonEditorEnabled={jsonEditorEnabled}
        />
      )}
    </div>
  );
};

export default ApplicationParametersTab;
