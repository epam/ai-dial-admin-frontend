'use client';

import { FC } from 'react';

import { getInterceptorTemplatesList } from '@/src/app/[lang]/interceptor-templates/actions';
import { getInterceptorContainers } from '@/src/app/[lang]/interceptors/actions';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';

import SimpleEntityProperties from '@/src/components/EntityMainProperties/SimpleEntityProperties';
import ForwardAuthTokenField from '@/src/components/EntityView/Properties/ForwardAuthToken/ForwardAuthTokenField';
import SourceField from '@/src/components/SourceField/SourceField';
import MaintainerControl from '@/src/components/EntityMainProperties/BaseProperties/Maintainer';

interface Props {
  selectedInterceptor: DialInterceptor;
  names: string[];
  onChangeInterceptor: (interceptor: DialInterceptor) => void;
}
const InterceptorProperties: FC<Props> = ({ selectedInterceptor, names, onChangeInterceptor }) => {
  const t = useI18n();

  return (
    <div className="h-full flex flex-col gap-10 divide-y divide-primary w-full">
      <div className="flex">
        <div className="lg:w-[35%] flex flex-col gap-6 mt-3">
          <SimpleEntityProperties
            entity={selectedInterceptor}
            onChangeEntity={onChangeInterceptor}
            names={names}
            isEntityImmutable={true}
            view={ApplicationRoute.Interceptors}
          />

          <MaintainerControl entity={selectedInterceptor} onChangeEntity={onChangeInterceptor} />

          <div className="w-full">
            <ForwardAuthTokenField
              view={ApplicationRoute.Interceptors}
              entity={selectedInterceptor}
              onChangeEntity={onChangeInterceptor}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col pt-3 w-full">
        <SourceField
          interceptor={selectedInterceptor}
          onChange={onChangeInterceptor}
          getContainers={getInterceptorContainers}
          getRunners={getInterceptorTemplatesList}
          elementId={'sourceType'}
          fieldTitle={t(EntitiesI18nKey.SourceType)}
        />
      </div>
    </div>
  );
};

export default InterceptorProperties;
