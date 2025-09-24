'use client';

import { FC } from 'react';

import { EntitiesI18nKey } from '@/src/constants/i18n';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';
import { getInterceptorTemplatesList } from '@/src/app/[lang]/interceptor-templates/actions';
import { getInterceptorContainers } from '@/src/app/[lang]/interceptors/actions';
import { getSourceItems } from '@/src/components/SourceField/constants';
import { useAppContext } from '@/src/context/AppContext';
import { isDeploymentsEnabled } from '@/src/utils/plugins';
import { useI18n } from '@/src/locales/client';

import Defaults from '@/src/components/Defaults/Defaults';
import MaintainerControl from '@/src/components/EntityMainProperties/BaseProperties/Maintainer';
import SimpleEntityProperties from '@/src/components/EntityMainProperties/SimpleEntityProperties';
import ForwardAuthTokenField from '@/src/components/EntityView/Properties/ForwardAuthToken/ForwardAuthTokenField';
import SourceField from '@/src/components/SourceField/SourceField';

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
    <div className="h-full flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-6">
        <div className="lg:w-[35%] flex flex-col gap-6 mt-3">
          <SimpleEntityProperties
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
      <div className="flex flex-col gap-6 w-full">
        <SourceField
          entity={selectedInterceptor}
          onChange={onChangeInterceptor}
          getContainers={getInterceptorContainers}
          getRunners={getInterceptorTemplatesList}
          elementId={'sourceType'}
          fieldTitle={t(EntitiesI18nKey.SourceType)}
          sourceItems={getSourceItems(ApplicationRoute.Interceptors, deploymentsEnabled)}
        />
        <Defaults entity={selectedInterceptor} onChangeEntity={onChangeInterceptor} />
      </div>
    </div>
  );
};

export default InterceptorProperties;
