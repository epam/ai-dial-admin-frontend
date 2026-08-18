'use client';

import { FC } from 'react';

import { getInterceptorTemplatesList } from '@/src/app/[lang]/interceptor-templates/actions';
import { getInterceptorContainers } from '@/src/app/actions/deployments';
import InterfacesField from '@/src/components/BaseControls/InterfacesField/InterfacesField';
import MaintainerControl from '@/src/components/BaseControls/Maintainer';
import OverrideNameControl from '@/src/components/BaseControls/OverrideName';
import TopicsControl from '@/src/components/BaseControls/Topics';
import Defaults from '@/src/components/Defaults/Defaults';
import ForwardAuthTokenField from '@/src/components/EntityMainProperties/ForwardAuthToken/ForwardAuthTokenField';
import EntityProperties from '@/src/components/EntityMainProperties/Properties/EntityProperties';
import { getSourceItems } from '@/src/components/SourceField/constants';
import SourceField from '@/src/components/SourceField/SourceField';
import { INTERCEPTOR_INTERFACE_TYPES } from '@/src/constants/deployment-interfaces';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  selectedInterceptor: DialInterceptor;
  names: string[];
  onChangeInterceptor: (interceptor: DialInterceptor) => void;
}
const InterceptorProperties: FC<Props> = ({ selectedInterceptor, names, onChangeInterceptor }) => {
  const t = useI18n();

  const { featureFlags } = useAppContext();

  return (
    <div className="flex flex-col gap-y-8 size-full">
      <EntityProperties
        entity={selectedInterceptor}
        onChangeEntity={onChangeInterceptor}
        names={names}
        isEntityImmutable={true}
        view={ApplicationRoute.Interceptors}
      />
      <MaintainerControl entity={selectedInterceptor} onChangeEntity={onChangeInterceptor} />
      <ForwardAuthTokenField
        view={ApplicationRoute.Interceptors}
        entity={selectedInterceptor}
        onChangeEntity={onChangeInterceptor}
      />
      <TopicsControl entity={selectedInterceptor} onChange={onChangeInterceptor} />
      <SourceField
        view={ApplicationRoute.Interceptors}
        entity={selectedInterceptor}
        onChange={onChangeInterceptor}
        getContainers={getInterceptorContainers}
        getRunners={getInterceptorTemplatesList}
        id="sourceType"
        label={t(EntitiesI18nKey.SourceType)}
        sourceItems={getSourceItems(ApplicationRoute.Interceptors, featureFlags.deploymentsEnabled)}
      />
      <Defaults
        values={selectedInterceptor.defaults}
        onChangeValues={(defaults) => onChangeInterceptor({ ...selectedInterceptor, defaults })}
      />
      <InterfacesField
        entity={selectedInterceptor}
        onChangeEntity={onChangeInterceptor}
        allowedTypes={INTERCEPTOR_INTERFACE_TYPES}
      />
      <OverrideNameControl entity={selectedInterceptor as any} onChangeEntity={onChangeInterceptor} />
    </div>
  );
};

export default InterceptorProperties;
