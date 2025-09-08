'use client';

import { FC } from 'react';

// import Defaults from '@/src/components/Defaults/Defaults';
import MaintainerControl from '@/src/components/EntityMainProperties/BaseProperties/Maintainer';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';
import { getInterceptorContainers } from '@/src/app/[lang]/interceptors/actions';
import { getInterceptorTemplatesList } from '@/src/app/[lang]/interceptor-templates/actions';
import { useAppContext } from '@/src/context/AppContext';
import { getSourceItems, INTERCEPTOR_SOURCE_ITEMS } from '@/src/components/SourceField/constants';
import { useI18n } from '@/src/locales/client';

import ForwardAuthTokenField from '@/src/components/EntityView/Properties/ForwardAuthToken/ForwardAuthTokenField';
import SimpleEntityProperties from '@/src/components/EntityMainProperties/SimpleEntityProperties';
import SourceField from '@/src/components/SourceField/SourceField';

interface Props {
  selectedInterceptor: DialInterceptor;
  names: string[];
  onChangeInterceptor: (interceptor: DialInterceptor) => void;
}
const InterceptorProperties: FC<Props> = ({ selectedInterceptor, names, onChangeInterceptor }) => {
  const t = useI18n();
  const { embeddedApps } = useAppContext();
  const deploymentsEnabled = embeddedApps?.some((app) => app.name === 'mcp-plugin');

  return (
    <div className="h-full flex flex-col gap-10 divide-y divide-primary w-full">
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
      <div className="flex flex-col gap-6 pt-3 w-full">
        <SourceField
          entity={selectedInterceptor}
          onChange={onChangeInterceptor}
          getContainers={getInterceptorContainers}
          getRunners={getInterceptorTemplatesList}
          elementId={'sourceType'}
          fieldTitle={t(EntitiesI18nKey.SourceType)}
          sourceItems={getSourceItems(INTERCEPTOR_SOURCE_ITEMS, deploymentsEnabled)}
        />
        {/* <Defaults entity={selectedInterceptor} onChangeEntity={onChangeInterceptor} /> */}
      </div>
    </div>
  );
};

export default InterceptorProperties;
