'use client';

import { FC, useCallback } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import SimpleEntityProperties from '@/src/components/EntityMainProperties/SimpleEntityProperties';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ApplicationRoute } from '@/src/types/routes';
import ForwardAuthTokenField from '@/src/components/EntityView/Properties/ForwardAuthToken/ForwardAuthTokenField';

interface Props {
  selectedInterceptor: DialInterceptor;
  names: string[];
  onChangeInterceptor: (interceptor: DialInterceptor) => void;
}
const InterceptorProperties: FC<Props> = ({ selectedInterceptor, names, onChangeInterceptor }) => {
  const t = useI18n();

  const onChangeEndpoint = useCallback(
    (endpoint: string) => {
      onChangeInterceptor({ ...selectedInterceptor, endpoint });
    },
    [selectedInterceptor, onChangeInterceptor],
  );

  return (
    <div className="h-full lg:w-[35%] flex flex-col gap-6 mt-3">
      <SimpleEntityProperties
        entity={selectedInterceptor}
        onChangeEntity={onChangeInterceptor}
        names={names}
        isEntityImmutable={true}
      />

      <TextInputField
        elementId="interceptorEndpoint"
        value={selectedInterceptor.endpoint}
        onChange={onChangeEndpoint}
        fieldTitle={t(EntitiesI18nKey.Endpoint)}
        placeholder={t(EntitiesI18nKey.EndpointPlaceholder)}
      />

      <TextInputField
        elementId="author"
        fieldTitle={t(EntitiesI18nKey.Maintainer)}
        placeholder={t(EntitiesI18nKey.MaintainerPlaceholder)}
        value={selectedInterceptor.author}
        optional={true}
        onChange={(author) => onChangeInterceptor({ ...selectedInterceptor, author })}
      />

      <div className="w-full">
        <ForwardAuthTokenField
          view={ApplicationRoute.Interceptors}
          entity={selectedInterceptor}
          onChangeEntity={onChangeInterceptor}
        />
      </div>
    </div>
  );
};

export default InterceptorProperties;
