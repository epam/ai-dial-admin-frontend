'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { TabModel } from '@epam/ai-dial-ui-kit';
import { cloneDeep } from 'lodash';

import {
  getCoreInterceptor,
  removeInterceptor,
  updateCoreInterceptor,
  updateInterceptor,
} from '@/src/app/[lang]/interceptors/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getInterceptorTabs } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  originalInterceptor: DialInterceptor;
  names: string[];
  etag: string;
  models: DialModel[];
  applications: DialApplication[];
  interceptorTemplate?: InterceptorTemplate | null;
  appRunners: DialApplicationScheme[];
}

const InterceptorView: FC<Props> = ({ originalInterceptor, names, etag, ...props }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();
  const getReqRef = useRef(useProtectedRequest());

  const tabs: TabModel[] = getInterceptorTabs(t);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedInterceptor, setSelectedInterceptor] = useState(cloneDeep(originalInterceptor));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(ExportFormat.ADMIN);
  const [coreInterceptor, setCoreInterceptor] = useState<DialInterceptor | null>(null);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      selectedFormat,
      onChangeSelectedFormat: setSelectedFormat,
      onToggleEditor: () => {
        setSelectedFormat(ExportFormat.ADMIN);

        setIsEditorEnabled((prev) => !prev);
      },
    }),
    [isEditorEnabled, selectedFormat],
  );

  useEffect(() => {
    const name = originalInterceptor?.name;
    if (!coreInterceptor && name) {
      getReqRef.current(getCoreInterceptor, name).then((data) => {
        setCoreInterceptor(data.response);
      });
    }
  }, [coreInterceptor, originalInterceptor]);

  useEffect(() => {
    setSelectedInterceptor(
      selectedFormat === ExportFormat.CORE
        ? cloneDeep(coreInterceptor as DialInterceptor)
        : cloneDeep(originalInterceptor),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormat, originalInterceptor]);

  useEffect(() => {
    const isEqualAdminInterceptor = isEqualSkippingUndefined(originalInterceptor, selectedInterceptor);
    const isEqualCoreInterceptor = isEqualSkippingUndefined(selectedInterceptor, coreInterceptor);

    setIsChanged(selectedFormat === ExportFormat.CORE ? !isEqualCoreInterceptor : !isEqualAdminInterceptor);
  }, [selectedFormat, originalInterceptor, selectedInterceptor, coreInterceptor]);

  const onDiscard = useCallback(() => {
    if (isEditorEnabled) {
      setSelectedFormat(ExportFormat.ADMIN);
    }
    setSelectedInterceptor(originalInterceptor);
  }, [isEditorEnabled, originalInterceptor]);

  const onSave = useCallback(() => {
    const req =
      selectedFormat === ExportFormat.CORE
        ? getReqRef.current(
            updateCoreInterceptor,
            selectedInterceptor as Record<string, unknown>,
            originalInterceptor.name || '',
            etag,
          )
        : getReqRef.current(updateInterceptor, selectedInterceptor, etag);

    req.then((res) => {
      if (res.success) {
        dispatch({ type: ValidationActionType.Reset });
        setCoreInterceptor(null);
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.Interceptors, t),
            getUpdateNotificationDescription(ApplicationRoute.Interceptors, selectedInterceptor.name, t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedFormat, selectedInterceptor, originalInterceptor.name, etag, dispatch, showNotification, t, router]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.Interceptors}
        entity={selectedInterceptor}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeInterceptor}
      />

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor
            entity={selectedInterceptor}
            setSelectedEntity={setSelectedInterceptor}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent
            selectedInterceptor={selectedInterceptor}
            originalInterceptor={originalInterceptor}
            selectedFormat={selectedFormat}
            onChange={setSelectedInterceptor}
            activeTab={activeTab}
            names={names}
            {...props}
          />
        )}
      </div>
    </div>
  );
};

export default InterceptorView;
