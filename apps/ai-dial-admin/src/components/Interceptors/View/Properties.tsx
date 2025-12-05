'use client';

import { FC } from 'react';

import { getInterceptorTemplatesList } from '@/src/app/[lang]/interceptor-templates/actions';
import { getSourceItems } from '@/src/components/SourceField/constants';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';
import { isDeploymentsEnabled } from '@/src/utils/plugins';

import Defaults from '@/src/components/Defaults/Defaults';
import MaintainerControl from '@/src/components/EntityMainProperties/BaseProperties/Maintainer';
import ForwardAuthTokenField from '@/src/components/EntityMainProperties/ForwardAuthToken/ForwardAuthTokenField';
import EntityProperties from '@/src/components/EntityMainProperties/Properties/EntityProperties';
import SourceField from '@/src/components/SourceField/SourceField';
import { getInterceptorContainers } from '@/src/app/actions/deployments';

interface Props {
  selectedInterceptor: DialInterceptor;
  names: string[];
  onChangeInterceptor: (interceptor: DialInterceptor) => void;
}
const InterceptorProperties: FC<Props> = ({ selectedInterceptor, names, onChangeInterceptor }) => {
  const t = useI18n();

  const { embeddedApps } = useAppContext();
  const deploymentsEnabled = isDeploymentsEnabled(embeddedApps);

  return (
    <div className="h-full flex flex-col gap-y-8 w-full">
      <div className="flex flex-col gap-y-8">
        <div className="lg:w-[35%] flex flex-col gap-y-8">
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
        </div>
      </div>
      <div className="flex flex-col gap-y-8 w-full">
        <SourceField
          view={ApplicationRoute.Interceptors}
          entity={selectedInterceptor}
          onChange={onChangeInterceptor}
          getContainers={getInterceptorContainers}
          getRunners={getInterceptorTemplatesList}
          elementId="sourceType"
          fieldTitle={t(EntitiesI18nKey.SourceType)}
          sourceItems={getSourceItems(ApplicationRoute.Interceptors, deploymentsEnabled)}
        />
        <Defaults entity={selectedInterceptor} onChangeEntity={onChangeInterceptor} />
      </div>
    </div>
  );
};

export default InterceptorProperties;
