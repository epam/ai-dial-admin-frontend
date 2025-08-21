import { NumberInputField, TextInputField } from '@/src/components/Common/InputField/InputField';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import RadioField from '@/src/components/Common/RadioField/RadioField';
import Switch from '@/src/components/Common/Switch/Switch';
import MaxRetryAttempts from '@/src/components/MaxRetryAttempts/MaxRetryAttempts';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, RoutesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialRoute, RouteOutput } from '@/src/models/dial/route';
import { RadioButtonModel } from '@/src/models/radio-button';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import { FC, useCallback, useState } from 'react';
import UpstreamEndpoints from '@/src/components/Endpoints/UpstreamEndpoints';
import Paths from '@/src/components/Routes/Paths/Paths';
import { handleRouteOutputChange } from '@/src/components/Routes/utils';
import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';

interface Props {
  route: DialRoute;
  isAppRoute?: boolean;
  updateRoute: (route: DialRoute) => void;
}

const RouteProperties: FC<Props> = ({ route, isAppRoute, updateRoute }) => {
  const t = useI18n();

  const outputRadio: RadioButtonModel[] = [
    { id: RouteOutput.UPSTREAMS, name: t(EntityFieldsI18nKey.upstreams) },
    { id: RouteOutput.RESPONSE, name: t(RoutesI18nKey.Response) },
  ];

  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE'];

  const [statusError, setStatusError] = useState('');

  const onChangeName = useCallback(
    (name: string) => {
      updateRoute({ ...route, name });
    },
    [route, updateRoute],
  );

  const onChangeRewritePath = useCallback(
    (rewritePath: boolean) => {
      updateRoute({ ...route, rewritePath });
    },
    [route, updateRoute],
  );

  const onChangeOutput = useCallback(
    (output: string) => {
      const newRoute = handleRouteOutputChange(route, output);
      updateRoute(newRoute);
    },
    [route, updateRoute],
  );

  const onChangeStatus = useCallback(
    (status: number | string) => {
      updateRoute({
        ...route,
        response: {
          ...route.response,
          status,
        },
      });
      setStatusError(+status >= 100 && +status <= 999 ? '' : t(RoutesI18nKey.InvalidStatus));
    },
    [route, updateRoute, t],
  );

  const onChangeBody = useCallback(
    (body: string) => {
      updateRoute({
        ...route,
        response: {
          ...route.response,
          body,
        },
      });
    },
    [route, updateRoute],
  );

  const onChangeMethods = useCallback(
    (methods: string[]) => {
      updateRoute({ ...route, methods });
    },
    [route, updateRoute],
  );

  const onChangeMaxRetryAttempts = useCallback(
    (maxRetryAttempts?: number) => {
      updateRoute({ ...route, maxRetryAttempts });
    },
    [updateRoute, route],
  );

  return (
    <div className="h-full flex flex-col pt-3 w-full">
      <div className="flex flex-col gap-6 lg:w-[35%]">
        {isAppRoute ? (
          <TextInputField
            elementId="name"
            fieldTitle={t(EntityFieldsI18nKey.displayName)}
            placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
            value={route.name}
            onChange={onChangeName}
          />
        ) : (
          <DescriptionControl entity={route} onChangeEntity={updateRoute} />
        )}
        <Paths route={route} updateRoute={updateRoute} />

        <Switch
          isOn={route.rewritePath}
          title={t(RoutesI18nKey.RewritePath)}
          switchId="RewritePath"
          onChange={onChangeRewritePath}
        />

        <Multiselect
          elementId="methods"
          selectedItems={route.methods}
          onChangeItems={onChangeMethods}
          heading={t(EntityFieldsI18nKey.methods)}
          title={t(EntityFieldsI18nKey.methods)}
          allItems={methods}
        />

        <RadioField
          radioButtons={outputRadio}
          activeRadioButton={route.response ? outputRadio[1].id : outputRadio[0].id}
          elementId="output"
          fieldTitle={t(RoutesI18nKey.Output)}
          orientation={RadioFieldOrientation.Row}
          onChange={onChangeOutput}
        />
      </div>
      <div className="mt-6 flex flex-col gap-6">
        {route.response ? (
          <div className="flex lg:w-[60%]">
            <div className="mr-2">
              <NumberInputField
                elementId="status"
                fieldTitle={t(EntityFieldsI18nKey.status)}
                placeholder={t(EntityPlaceholdersI18nKey.Status)}
                value={route.response.status}
                onChange={onChangeStatus}
                errorText={statusError}
                invalid={!!statusError}
              />
            </div>
            <div className="flex-1">
              <TextInputField
                elementId="body"
                fieldTitle={t(EntityFieldsI18nKey.body)}
                placeholder={t(EntityPlaceholdersI18nKey.Body)}
                value={route.response.body}
                onChange={onChangeBody}
              />
            </div>
          </div>
        ) : (
          <UpstreamEndpoints entity={route} onChangeEntity={updateRoute} />
        )}

        <MaxRetryAttempts
          maxRetryAttempts={route.maxRetryAttempts}
          onChangeMaxRetryAttempts={onChangeMaxRetryAttempts}
        />
        <div className="lg:w-[35%]">
          <NumberInputField
            elementId="order"
            fieldTitle={t(EntityFieldsI18nKey.order)}
            placeholder={t(EntityPlaceholdersI18nKey.Order)}
            value={route.order}
            min={0}
            onChange={(order) => {
              updateRoute({ ...route, order: order ? +order : undefined });
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default RouteProperties;
