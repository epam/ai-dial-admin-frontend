import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ButtonVariant,
  DialButton,
  DialNumberInputField,
  DialRadioGroup,
  DialSelectField,
  DialSwitch,
  DialTextInputField,
  RadioButtonWithContent,
  RadioGroupOrientation,
  SelectOption,
} from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import UpstreamEndpoints from '@/src/components/UpstreamEndpoints/UpstreamEndpoints';
import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import MaxRetryAttempts from '@/src/components/EntityMainProperties/BaseProperties/MaxRetryAttempts';
import Paths from '@/src/components/Routes/Paths/Paths';
import { handleRouteOutputChange } from '@/src/components/Routes/utils';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ErrorI18nKey, RoutesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialAppRoute, DialRoute, RouteOutput, RoutePermission } from '@/src/models/dial/route';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { BASE_ICON_PROPS, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { IconRefresh } from '@tabler/icons-react';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { ORDER_DEFAULT_VALUE } from '@/src/constants/routes';

interface Props {
  route: DialRoute | DialAppRoute;
  isAppRoute?: boolean;
  readonly?: boolean;
  updateRoute: (route: DialRoute | DialAppRoute) => void;
}

const RouteProperties: FC<Props> = ({ route, readonly, isAppRoute, updateRoute }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();

  const outputRadio: RadioButtonWithContent[] = [
    { id: RouteOutput.UPSTREAMS, name: t(EntityFieldsI18nKey.upstreams) },
    { id: RouteOutput.RESPONSE, name: t(EntityFieldsI18nKey.response) },
  ];

  const permissionsItems: SelectOption[] = useMemo(
    () => [
      { value: 'read', label: t(RoutesI18nKey.Read) },
      { value: 'write', label: t(RoutesI18nKey.Write) },
    ],
    [t],
  );

  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE'];

  const [statusError, setStatusError] = useState('');
  const [bodyError, setBodyError] = useState('');
  const [orderError, setOrderError] = useState('');

  const [isUpstreamsRequired, setIsUpstreamsRequired] = useState(!route.response);

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
    if (isAppRoute) {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'endpoints',
        isValid: !!route.response || !!route.upstreams?.length,
      });
    }
  }, [isAppRoute, dispatch, route.upstreams?.length, route.response]);

  const selectedPermissions = useMemo(() => {
    return (route as DialAppRoute).permissions?.map(
      (p) => permissionsItems.find((i) => i.value === p)?.value as string,
    );
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
      setIsUpstreamsRequired(output !== RouteOutput.RESPONSE);
      setStatusError(output === RouteOutput.RESPONSE ? t(ErrorI18nKey.RequiredField) : '');
      setBodyError(output === RouteOutput.RESPONSE ? t(ErrorI18nKey.RequiredField) : '');
    },
    [route, t, updateRoute],
  );

  const onChangeStatus = useCallback(
    (status?: number | string) => {
      updateRoute({
        ...route,
        response: {
          ...route.response,
          status,
        },
      });
      setStatusError(status && +status >= 100 && +status <= 999 ? '' : t(ErrorI18nKey.InvalidStatus));
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
    (values: string[]) => {
      updateRoute({
        ...route,
        permissions: values as RoutePermission[],
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

  const onChangeOrder = useCallback(
    (order?: string | number) => {
      updateRoute({ ...route, order: order ? +order : undefined });
      dispatch({ type: ValidationActionType.SetField, field: 'order', isValid: !!order });
      setOrderError(order ? '' : t(ErrorI18nKey.RequiredField));
    },
    [route, updateRoute, dispatch, t],
  );

  const onRefreshOrder = useCallback(() => {
    updateRoute({
      ...route,
      order: ORDER_DEFAULT_VALUE,
    });
    dispatch({ type: ValidationActionType.SetField, field: 'order', isValid: true });
    setOrderError('');
  }, [route, updateRoute, dispatch]);

  return (
    <div className="h-full flex flex-col w-full gap-y-8">
      <DisplayNameControl
        displayName={route.displayName}
        required={true}
        isFullWidth={false}
        onChange={onChangeDisplayName}
        disabled={readonly}
      />
      {!isAppRoute && <DescriptionControl entity={route} onChangeEntity={updateRoute} isFullWidth={false} />}
      <Paths
        title={t(EntityFieldsI18nKey.paths)}
        paths={route.paths}
        onChangePaths={onChangePaths}
        readonly={readonly}
      />
      <DialSwitch
        isOn={route.rewritePath}
        label={t(EntityFieldsI18nKey.rewritePath)}
        switchId="RewritePath"
        disabled={readonly}
        onChange={onChangeRewritePath}
      />
      <Multiselect
        elementId="methods"
        disabled={readonly}
        selectedItems={route.methods}
        onChangeItems={onChangeMethods}
        heading={t(EntityFieldsI18nKey.methods)}
        title={t(EntityFieldsI18nKey.methods)}
        allItems={methods}
        className={STANDARD_CONTROL_WIDTH}
        errorText={route.methods?.length ? '' : t(ErrorI18nKey.EmptyField)}
      />
      <DialRadioGroup
        radioButtons={outputRadio}
        activeRadioButton={route.response ? outputRadio[1].id : outputRadio[0].id}
        elementId="output"
        disabled={readonly}
        fieldTitle={t(RoutesI18nKey.Output)}
        orientation={RadioGroupOrientation.Row}
        onChange={onChangeOutput}
      />
      <div className={classNames('flex gap-x-2 flex-row', STANDARD_CONTROL_WIDTH, !route.response && 'hidden')}>
        <DialNumberInputField
          disabled={readonly}
          elementId="status"
          containerClassName="w-[150px]"
          fieldTitle={t(EntityFieldsI18nKey.status)}
          placeholder={t(EntityPlaceholdersI18nKey.Status)}
          value={route.response?.status}
          onChange={onChangeStatus}
          errorText={statusError}
          invalid={!!statusError}
        />
        <DialTextInputField
          disabled={readonly}
          elementId="body"
          containerClassName="flex-1"
          fieldTitle={t(EntityFieldsI18nKey.body)}
          placeholder={t(EntityPlaceholdersI18nKey.Body)}
          value={route.response?.body}
          onChange={onChangeBody}
          errorText={bodyError}
          invalid={!!bodyError}
        />
      </div>

      <div className={classNames(route.response && 'hidden')}>
        <UpstreamEndpoints
          readonly={readonly}
          entity={route}
          onChangeEntity={updateRoute}
          required={isUpstreamsRequired}
        />
      </div>
      <MaxRetryAttempts readonly={readonly} entity={route} onChangeEntity={updateRoute} />
      {isAppRoute && (
        <DialSelectField
          disabled={readonly}
          placeholder={t(EntityPlaceholdersI18nKey.SelectPermission)}
          elementId="permissions"
          multiple={true}
          className={STANDARD_CONTROL_WIDTH}
          containerClassName={STANDARD_CONTROL_WIDTH}
          options={permissionsItems}
          value={selectedPermissions}
          fieldTitle={t(EntityFieldsI18nKey.permissions)}
          onChange={(values) => onChangePermissions(values as string[])}
        />
      )}
      <div className={classNames('flex gap-x-2 flex-row items-start', STANDARD_CONTROL_WIDTH)}>
        <DialNumberInputField
          elementId="order"
          disabled={readonly}
          containerClassName={'w-[50%]'}
          fieldTitle={t(EntityFieldsI18nKey.order)}
          placeholder={t(EntityPlaceholdersI18nKey.Order)}
          value={route.order}
          min={0}
          onChange={onChangeOrder}
          errorText={orderError}
          invalid={!!orderError}
        />
        {route.order !== ORDER_DEFAULT_VALUE && (
          <DialButton
            className="dial-tertiary-button mt-6"
            variant={ButtonVariant.Secondary}
            label={t(ButtonsI18nKey.ResetToDefault)}
            iconBefore={<IconRefresh {...BASE_ICON_PROPS} />}
            onClick={onRefreshOrder}
          />
        )}
      </div>
    </div>
  );
};

export default RouteProperties;
