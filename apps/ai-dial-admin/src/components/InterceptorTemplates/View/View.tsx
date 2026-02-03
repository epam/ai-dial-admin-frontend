'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { cloneDeep } from 'lodash';

import { deleteInterceptorTemplate, updateInterceptorTemplate } from '@/src/app/[lang]/interceptor-templates/actions';
import { createInterceptor } from '@/src/app/[lang]/interceptors/actions';
import CreateEntity from '@/src/components/EntityListView/CreateEntity/CreateEntity';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import EntityHeader from '@/src/components/EntityView/Header/Header';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import ExtendedProperties from '@/src/components/InterceptorTemplates/Properties/ExtendedProperties';
import Interceptors from '@/src/components/InterceptorTemplates/View/Interceptors/Interceptors';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { getViewHeaderClassName } from '@/src/utils/entities/view';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getInterceptorTemplateTabs } from '@/src/utils/tabs/utils';
import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';

interface Props {
  etag: string;
  template: InterceptorTemplate;
  names: string[];
}

const View: FC<Props> = ({ etag, template, names }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [isChanged, setIsChanged] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(cloneDeep(template));
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tabs = getInterceptorTemplateTabs(t);

  // todo change when source field will be added to create interceptor template modal
  const source = useMemo(() => {
    return {
      source: {
        $type: SOURCE_TYPE.RUNNER,
        runnerName: selectedTemplate.name,
      },
    };
  }, [selectedTemplate.name]);

  const onSave = useCallback(() => {
    getReqRef.current(updateInterceptorTemplate, selectedTemplate, etag).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.InterceptorTemplates, t),
            getUpdateNotificationDescription(ApplicationRoute.InterceptorTemplates, selectedTemplate.name, t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedTemplate, etag, showNotification, t, router]);

  const onDiscard = useCallback(() => {
    setSelectedTemplate(cloneDeep(template));
  }, [template]);

  useEffect(() => {
    const { updatedAt: __updateTemplate, ...restTemplate } = template;
    const { updatedAt: __updateSelected, ...restSelectedTemplate } = selectedTemplate;
    setIsChanged(!isEqualSkippingUndefined(restTemplate, restSelectedTemplate));
  }, [template, selectedTemplate]);

  const onChange = useCallback((template: InterceptorTemplate) => {
    setSelectedTemplate(template);
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={getViewHeaderClassName()}>
        <Tabs tabs={tabs} activeTab={activeTab} onChangeActiveTab={setActiveTab} />
        <HeaderButtons
          view={ApplicationRoute.InterceptorTemplates}
          entity={selectedTemplate}
          isChanged={isChanged}
          onSave={onSave}
          onDiscard={onDiscard}
          onRemove={deleteInterceptorTemplate}
          isHideJsonEditor={true}
        >
          <DialNeutralButton
            label={`${t(ButtonsI18nKey.Create)} ${t(CreateI18nKey.Interceptor)}`}
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            onClick={() => setIsModalOpen(true)}
          />
        </HeaderButtons>
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {activeTab === EntityViewTab.Properties && (
          <>
            <EntityHeader entity={selectedTemplate} />
            <div className="flex-1 min-h-0 pt-8">
              <ExtendedProperties template={selectedTemplate} onChange={onChange} />
            </div>
          </>
        )}
        {activeTab === EntityViewTab.Interceptors && <Interceptors interceptorList={selectedTemplate.interceptors} />}
        {activeTab === EntityViewTab.Audit && (
          <EntityAudit entity={selectedTemplate} view={ApplicationRoute.InterceptorTemplates} />
        )}
        {isModalOpen &&
          createPortal(
            <CreateEntity
              route={ApplicationRoute.Interceptors}
              isModalOpen={isModalOpen}
              createEntity={createInterceptor}
              onClose={() => setIsModalOpen(false)}
              names={names || []}
              initialValues={source}
            />,
            document.body,
          )}
      </div>
    </div>
  );
};

export default View;
