'use client';

import { useSession } from 'next-auth/react';
import { FC, useMemo, useState } from 'react';

import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';
import { IconPlus, IconReload } from '@tabler/icons-react';

import {
  generateViewItems,
  getAppRunner,
  getFrameConfig,
  getInitialParamsView,
} from '@/src/components/Applications/ParametersTab/utils';
import FrameRenderer from '@/src/components/FrameRenderer/FrameRenderer';
import { ButtonsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useTheme } from '@/src/context/ThemeContext';
import { useI18n } from '@/src/locales/client';
import { UserSession } from '@/src/models/auth';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialApplicationResource } from '@/src/models/dial/application-resource';
import { ApplicationRoute } from '@/src/types/routes';
import FormView from './FormView';
import TableView from './TableView';
import ViewControl from './ViewControl';
import { ParamsView } from './types';

interface Props {
  entity?: DialApplication | DialApplicationResource;
  applicationSchemes?: DialApplicationScheme[] | null;
  jsonEditorEnabled?: boolean;
  view?: ApplicationRoute;
  isChanged?: boolean;
  onSave?: () => void;
}

const ApplicationParametersTab: FC<Props> = ({
  entity,
  applicationSchemes,
  jsonEditorEnabled,
  view,
  isChanged,
  onSave,
}) => {
  const t = useI18n() as (s: string) => string;
  const { data: session } = useSession();
  const { currentTheme } = useTheme();
  const scheme = getAppRunner(entity as DialApplication, applicationSchemes);

  const frameConfig = useMemo(() => {
    if (scheme) {
      return getFrameConfig(scheme, currentTheme, session as UserSession);
    } else if (entity?.editorUrl) {
      return getFrameConfig(entity, currentTheme, session as UserSession);
    }
    return null;
  }, [currentTheme, entity, scheme, session]);

  const targetUrl = useMemo(() => {
    try {
      const iframeUrl = `${frameConfig?.host}?authProvider=${frameConfig?.providerId}&theme=${frameConfig?.theme}&id=${entity?.name}`;
      return new URL(iframeUrl);
    } catch (error) {
      if (error) {
        return null;
      }
    }
  }, [entity, frameConfig]);

  const viewItems = generateViewItems(t, view, !!targetUrl, !!frameConfig);
  const [paramsView, setParamsView] = useState(getInitialParamsView(view, !!targetUrl));

  const showDropdown = useMemo(() => {
    return !!viewItems.length;
  }, [viewItems.length]);

  const showResetToDefault = useMemo(() => {
    return false;
  }, []);

  const showAdd = useMemo(() => {
    return false;
  }, []);

  return (
    <div className="flex flex-col w-full h-full pt-5">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row gap-4 items-center">
          <h1>{t(TabsI18nKey.Parameters)}</h1>
          {showDropdown && (
            <ViewControl
              items={viewItems}
              paramsView={paramsView}
              setParamsView={setParamsView}
              isChanged={isChanged}
              onSave={onSave}
            />
          )}
        </div>
        <div className="flex flex-row gap-4">
          {showResetToDefault && (
            <DialButton
              variant={ButtonVariant.Secondary}
              iconBefore={<IconReload {...BASE_ICON_PROPS} />}
              title={t(ButtonsI18nKey.ResetToDefault)}
            />
          )}
          {showAdd && (
            <DialButton
              variant={ButtonVariant.Primary}
              iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
              title={t(ButtonsI18nKey.Add)}
            />
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {paramsView === ParamsView.TABLE && <TableView />}
        {paramsView === ParamsView.FORM && <FormView />}
        {paramsView === ParamsView.UI && (
          <FrameRenderer
            iframeUrl={targetUrl?.href ?? ''}
            name={frameConfig?.name}
            jsonEditorEnabled={jsonEditorEnabled}
          />
        )}
      </div>
    </div>
  );
};

export default ApplicationParametersTab;
