import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { DialSwitch } from '@epam/ai-dial-ui-kit';

import { NumberInputField, TextInputField } from '@/src/components/Common/InputField/InputField';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import RadioField from '@/src/components/Common/RadioField/RadioField';
import UpstreamEndpoints from '@/src/components/Endpoints/UpstreamEndpoints';
import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import MaxRetryAttempts from '@/src/components/EntityMainProperties/BaseProperties/MaxRetryAttempts';
import Paths from '@/src/components/Routes/Paths/Paths';
import { handleRouteOutputChange } from '@/src/components/Routes/utils';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ErrorI18nKey, RoutesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialAppRoute, DialRoute, RouteOutput, RoutePermission } from '@/src/models/dial/route';
import { RadioButtonModel } from '@/src/models/radio-button';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  route: DialRoute | DialAppRoute;
  isAppRoute?: boolean;
  readonly?: boolean;
  updateRoute: (route: DialRoute | DialAppRoute) => void;
}

const RouteProperties: FC<Props> = ({ route, readonly, isAppRoute, updateRoute }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();

  const outputRadio: RadioButtonModel[] = [
    { id: RouteOutput.UPSTREAMS, name: t(EntityFieldsI18nKey.upstreams) },
    { id: RouteOutput.RESPONSE, name: t(EntityFieldsI18nKey.response) },
  ];

  const permissionsItems: DropdownItemsModel[] = useMemo(
    () => [
      { id: 'read', name: t(RoutesI18nKey.Read) },
      { id: 'write', name: t(RoutesI18nKey.Write) },
    ],
    [t],
  );

  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE'];

  const [statusError, setStatusError] = useState('');
  const [bodyError, setBodyError] = useState('');

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'status', isValid: !statusError });
  }, [dispatch, statusError]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'body', isValid: !bodyError });
  }, [dispatch, bodyError]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'methods', isValid: !!route.methods?.length });
  }, [dispatch, route.methods]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'endpoints', isValid: !!route.upstreams?.length });
  }, [dispatch, route.upstreams?.length]);

  const selectedPermissions = useMemo(() => {
    const values = (route as DialAppRoute).permissions?.map(
      (p) => permissionsItems.find((i) => i.id === p)?.name as string,
    );
    return !values || !values?.length ? null : values;
  }, [permissionsItems, route]);

  const onChangeDisplayName = useCallback(
    (displayName?: string) => {
      updateRoute({ ...route, displayName });
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
      if (output === RouteOutput.RESPONSE) {
        setStatusError(t(ErrorI18nKey.RequiredField));

        setBodyError(t(ErrorI18nKey.RequiredField));
      }
    },
    [route, t, updateRoute],
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
      setStatusError(+status >= 100 && +status <= 999 ? '' : t(ErrorI18nKey.InvalidStatus));
    },
    [route, updateRoute, t],
  );

  const onChangeBody = useCallback(
    (body?: string) => {
      updateRoute({
        ...route,
        response: {
          ...route.response,
          body,
        },
      });
      setBodyError(body ? '' : t(ErrorI18nKey.RequiredField));
    },
    [route, t, updateRoute],
  );

  const onChangeMethods = useCallback(
    (methods: string[]) => {
      updateRoute({ ...route, methods });
    },
    [route, updateRoute],
  );

  const onChangePermissions = useCallback(
    (value: string) => {
      const appRoute = route as DialAppRoute;
      updateRoute({
        ...route,
        permissions: appRoute.permissions?.includes(value as RoutePermission)
          ? appRoute.permissions?.filter((v) => v !== value)
          : [...(appRoute.permissions || []), value as RoutePermission],
      });
    },
    [route, updateRoute],
  );

  const onChangePaths = useCallback(
    (paths: string[]) => {
      updateRoute({ ...route, paths });
    },
    [route, updateRoute],
  );

  return (
    <div className="h-full flex flex-col pt-3 w-full">
      <div className="flex flex-col gap-6 lg:w-[35%]">
        <DisplayNameControl
          displayName={route.displayName || route.name}
          required={isAppRoute}
          onChange={onChangeDisplayName}
          disabled={readonly}
        />
        {!isAppRoute && <DescriptionControl entity={route} onChangeEntity={updateRoute} />}
        <Paths
          title={t(EntityFieldsI18nKey.paths)}
          paths={route.paths}
          onChangePaths={onChangePaths}
          readonly={readonly}
        />

        <DialSwitch
          isOn={route.rewritePath}
          title={t(EntityFieldsI18nKey.rewritePath)}
          switchId="RewritePath"
          disabled={readonly}
          onChange={onChangeRewritePath}
        />

        <Multiselect
          elementId="methods"
          readonly={readonly}
          selectedItems={route.methods}
          onChangeItems={onChangeMethods}
          heading={t(EntityFieldsI18nKey.methods)}
          title={t(EntityFieldsI18nKey.methods)}
          allItems={methods}
          errorText={route.methods?.length ? '' : t(ErrorI18nKey.EmptyField)}
        />

        <RadioField
          radioButtons={outputRadio}
          activeRadioButton={route.response ? outputRadio[1].id : outputRadio[0].id}
          elementId="output"
          disabled={readonly}
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
                disabled={readonly}
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
                disabled={readonly}
                elementId="body"
                fieldTitle={t(EntityFieldsI18nKey.body)}
                placeholder={t(EntityPlaceholdersI18nKey.Body)}
                value={route.response.body}
                onChange={onChangeBody}
                errorText={bodyError}
                invalid={!!bodyError}
              />
            </div>
          </div>
        ) : (
          <UpstreamEndpoints readonly={readonly} entity={route} onChangeEntity={updateRoute} />
        )}

        <MaxRetryAttempts readonly={readonly} entity={route} onChangeEntity={updateRoute} />

        <div className="lg:w-[25%] flex flex-col gap-6">
          {isAppRoute && (
            <DropdownField
              disabled={readonly}
              placeholder={t(EntityPlaceholdersI18nKey.SelectPermission)}
              elementId="permissions"
              items={permissionsItems}
              multipleValues={selectedPermissions}
              fieldTitle={t(EntityFieldsI18nKey.permissions)}
              onChange={onChangePermissions}
            />
          )}
          <NumberInputField
            elementId="order"
            disabled={readonly}
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
