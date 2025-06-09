import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { NumberInputField, TextInputField } from '@/src/components/Common/InputField/InputField';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import RadioField from '@/src/components/Common/RadioField/RadioField';
import Switch from '@/src/components/Common/Switch/Switch';
import TextAreaField from '@/src/components/Common/TextAreaField/TextAreaField';
import MaxRetryAttempts from '@/src/components/MaxRetryAttempts/MaxRetryAttempts';
import { CreateI18nKey, RoutesI18nKey } from '@/src/constants/i18n';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import { useI18n } from '@/src/locales/client';
import { DialRoute, RouteOutput } from '@/src/models/dial/route';
import { RadioButtonModel } from '@/src/models/radio-button';
import { FC, useCallback, useState } from 'react';
import UpstreamEndpoints from '../Endpoints/UpstreamEndpoints';
import Paths from './Paths/Paths';
import { handleRouteOutputChange } from './routes';

interface Props {
  route: DialRoute;
  updateRoute: (route: DialRoute) => void;
}

const RouteProperties: FC<Props> = ({ route, updateRoute }) => {
  const t = useI18n();

  const outputRadio: RadioButtonModel[] = [
    { id: RouteOutput.UPSTREAMS, name: t(RoutesI18nKey.Upstreams) },
    { id: RouteOutput.RESPONSE, name: t(RoutesI18nKey.Response) },
  ];

  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE'];

  const [statusError, setStatusError] = useState('');

  const onChangeDescription = useCallback(
    (description: string) => {
      updateRoute({ ...route, description });
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
        <TextInputField
          elementId="name"
          fieldTitle={t(CreateI18nKey.NameTitle)}
          placeholder={t(CreateI18nKey.NamePlaceholder)}
          value={route.name}
          disabled={true}
          iconAfterInput={<CopyButton field={route.name} />}
        />
        <TextAreaField
          elementId="description"
          fieldTitle={t(CreateI18nKey.DescriptionTitle)}
          placeholder={t(CreateI18nKey.DescriptionPlaceholder)}
          optional={true}
          value={route.description}
          onChange={onChangeDescription}
        />

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
          heading={t(RoutesI18nKey.MethodsTitle)}
          title={t(RoutesI18nKey.MethodsTitle)}
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
                fieldTitle={t(RoutesI18nKey.StatusTitle)}
                placeholder={t(RoutesI18nKey.StatusPlaceholder)}
                value={route.response.status}
                onChange={onChangeStatus}
                errorText={statusError}
                invalid={!!statusError}
              />
            </div>
            <div className="flex-1">
              <TextInputField
                elementId="body"
                fieldTitle={t(RoutesI18nKey.BodyTitle)}
                placeholder={t(RoutesI18nKey.BodyPlaceholder)}
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
      </div>
    </div>
  );
};

export default RouteProperties;
