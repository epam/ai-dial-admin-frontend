'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import { cloneDeep, isEqual } from 'lodash';
import { useRouter } from 'next/navigation';

import { ApplicationRoute } from '@/src/types/routes';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { useI18n } from '@/src/locales/client';
import { EntityViewTab, interceptorsTabs, propertiesTabs } from '@/src/components/EntityView/entity-view';
import { deleteInterceptorTemplate, updateInterceptorTemplate } from '@/src/app/[lang]/interceptor-templates/actions';
import { getErrorNotification } from '@/src/utils/notification';
import { useNotification } from '@/src/context/NotificationContext';

import EntityViewHeaderButtons from '@/src/components/EntityView/EntityViewHeaderButtons';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import ExtendedProperties from '@/src/components/InterceptorTemplates/Properties/ExtendedProperties';
import Interceptors from '@/src/components/InterceptorTemplates/View/Interceptors/Interceptors';

interface Props {
  route: ApplicationRoute;
  template: InterceptorTemplate;
}

const View: FC<Props> = ({ route, template }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const router = useRouter();
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [isChanged, setIsChanged] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(cloneDeep(template));

  const tabs = [propertiesTabs(t), interceptorsTabs(t)];

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      setActiveTab(tab as EntityViewTab);
    },
    [setActiveTab],
  );

  const onSave = useCallback(() => {
    updateInterceptorTemplate(selectedTemplate).then((res) => {
      if (res.success) {
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [router, selectedTemplate, showNotification]);

  const onDiscard = useCallback(() => {
    setSelectedTemplate(cloneDeep(template));
  }, [template]);

  useEffect(() => {
    setIsChanged(!isEqual(template, selectedTemplate));
  }, [template, selectedTemplate]);

  const onChange = useCallback((template: InterceptorTemplate) => {
    setSelectedTemplate(template);
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className="flex flex-row min-h-[34px] justify-between">
        <Tabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />
        <EntityViewHeaderButtons
          view={route}
          entity={selectedTemplate}
          isChanged={isChanged}
          onSave={onSave}
          onDiscard={onDiscard}
          removeEntity={deleteInterceptorTemplate}
          hideJsonEditor={true}
          jsonEditorEnabled={false}
          jsonErrors={null}
        />
      </div>
      <div className="flex-1 overflow-auto mt-3 min-h-0">
        {activeTab === EntityViewTab.Properties && (
          <ExtendedProperties template={selectedTemplate} onChange={onChange} />
        )}
        {activeTab === EntityViewTab.Interceptors && <Interceptors interceptorList={selectedTemplate.interceptors} />}
      </div>
    </div>
  );
};

export default View;
