import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ButtonAppearance,
  DialNumberInput,
  DialPrimaryButton,
  DialRadioGroup,
  DialSelectField,
  DialSwitch,
  DialInput,
  RadioButtonWithContent,
  RadioGroupOrientation,
  SelectOption,
} from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import UpstreamEndpoints from '@/src/components/UpstreamEndpoints/UpstreamEndpoints';
import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import MaxRetryAttempts from '@/src/components/BaseControls/MaxRetryAttempts';
import Paths from '@/src/components/Routes/Paths/Paths';
import { handleRouteOutputChange } from '@/src/components/Routes/utils';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ErrorI18nKey, RoutesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialAppRoute, DialRoute, RouteOutput, RoutePermission } from '@/src/models/dial/route';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { BASE_BUTTON_ICON_PROPS, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { IconRefresh } from '@tabler/icons-react';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { ORDER_DEFAULT_VALUE } from '@/src/constants/routes';
import TopicsControl from '@/src/components/BaseControls/Topics';

interface Props {
  route: DialRoute | DialAppRoute;
  isAppRoute?: boolean;
  readonly?: boolean;
  routeNames?: string[];
  onChange: (route: DialRoute | DialAppRoute) => void;
}

const RouteProperties: FC<Props> = ({ route, readonly, isAppRoute, routeNames, onChange }) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();

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
    if (resetCounter) {
      setStatusError('');
      setBodyError('');
    }
  }, [resetCounter]);

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
      onChange(isAppRoute ? { ...route, name: displayName } : { ...route, displayName });
    },
    [onChange, isAppRoute, route],
  );

  const onChangeRewritePath = useCallback(
    (rewritePath: boolean) => {
      onChange({ ...route, rewritePath });
    },
    [route, onChange],
  );

  const onChangeOutput = useCallback(
    (output: string) => {
      const newRoute = handleRouteOutputChange(route, output);
      onChange(newRoute);
      setIsUpstreamsRequired(output !== RouteOutput.RESPONSE);
      setStatusError(output === RouteOutput.RESPONSE ? t(ErrorI18nKey.RequiredField) : '');
      setBodyError(output === RouteOutput.RESPONSE ? t(ErrorI18nKey.RequiredField) : '');
    },
    [route, t, onChange],
  );

  const onChangeStatus = useCallback(
    (status?: number | string) => {
      onChange({
        ...route,
        response: {
          ...route.response,
          status,
        },
      });
      setStatusError(status && +status >= 100 && +status <= 999 ? '' : t(ErrorI18nKey.InvalidStatus));
    },
    [route, onChange, t],
  );

  const onChangeBody = useCallback(
    (body?: string) => {
      onChange({
        ...route,
        response: {
          ...route.response,
          body,
        },
      });
      setBodyError(body ? '' : t(ErrorI18nKey.RequiredField));
    },
    [route, t, onChange],
  );

  const onChangeMethods = useCallback(
    (methods: string[]) => {
      onChange({ ...route, methods });
    },
    [route, onChange],
  );

  const onChangePermissions = useCallback(
    (values: string[]) => {
      onChange({
        ...route,
        permissions: values as RoutePermission[],
      });
    },
    [route, onChange],
  );

  const onChangePaths = useCallback(
    (paths: string[]) => {
      onChange({ ...route, paths });
    },
    [route, onChange],
  );

  const onChangeOrder = useCallback(
    (order?: string | number) => {
      onChange({ ...route, order: order ? +order : undefined });
      dispatch({ type: ValidationActionType.SetField, field: 'order', isValid: !!order });
      setOrderError(order ? '' : t(ErrorI18nKey.RequiredField));
    },
    [route, onChange, dispatch, t],
  );

  const onResetOrder = useCallback(() => {
    onChange({
      ...route,
      order: ORDER_DEFAULT_VALUE,
    });
    dispatch({ type: ValidationActionType.SetField, field: 'order', isValid: true });
    setOrderError('');
  }, [route, onChange, dispatch]);

  return (
    <div className="h-full flex flex-col w-full gap-y-8">
      <DisplayNameControl
        displayName={isAppRoute ? route.name : route.displayName}
        required={true}
        isFullWidth={false}
        onChange={onChangeDisplayName}
        disabled={readonly}
        names={isAppRoute ? routeNames || [] : void 0}
      />
      {!isAppRoute && <DescriptionControl entity={route} onChangeEntity={onChange} isFullWidth={false} />}
      <Paths
        label={t(EntityFieldsI18nKey.paths)}
        paths={route.paths}
        onChangePaths={onChangePaths}
        required
        readonly={readonly}
      />
      <DialSwitch
        isOn={route.rewritePath}
        label={t(EntityFieldsI18nKey.rewritePath)}
        switchId="rewritePath"
        disabled={readonly}
        onChange={onChangeRewritePath}
      />
      <Multiselect
        elementId="methods"
        disabled={readonly}
        selectedItems={route.methods}
        onChangeItems={onChangeMethods}
        heading={t(EntityFieldsI18nKey.methods)}
        label={t(EntityFieldsI18nKey.methods)}
        allItems={methods}
        className={STANDARD_CONTROL_WIDTH}
        errorText={route.methods?.length ? '' : t(ErrorI18nKey.EmptyField)}
      />

      {!isAppRoute && <TopicsControl entity={route} onChange={onChange} />}
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
        <DialNumberInput
          disabled={readonly}
          id="status"
          containerClassName="w-[150px]"
          labelProps={{ label: t(EntityFieldsI18nKey.status) }}
          placeholder={t(EntityPlaceholdersI18nKey.Status)}
          value={route.response?.status}
          onChange={onChangeStatus}
          errorText={statusError}
          invalid={!!statusError}
        />
        <DialInput
          disabled={readonly}
          id="body"
          containerClassName="flex-1"
          labelProps={{ label: t(EntityFieldsI18nKey.body) }}
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
          onChangeEntity={onChange}
          required={isUpstreamsRequired}
        />
      </div>
      <MaxRetryAttempts readonly={readonly} entity={route} onChangeEntity={onChange} />
      {isAppRoute && (
        <DialSelectField
          disabled={readonly}
          placeholder={t(EntityPlaceholdersI18nKey.SelectPermission)}
          id="permissions"
          multiple={true}
          className={STANDARD_CONTROL_WIDTH}
          containerClassName={STANDARD_CONTROL_WIDTH}
          options={permissionsItems}
          value={selectedPermissions}
          label={t(EntityFieldsI18nKey.permissions)}
          onChange={(values) => onChangePermissions(values as string[])}
        />
      )}
      <div className={classNames('flex gap-x-2 flex-row items-end', STANDARD_CONTROL_WIDTH)}>
        <DialNumberInput
          id="order"
          disabled={readonly}
          containerClassName="w-[50%]"
          labelProps={{ label: t(EntityFieldsI18nKey.order) }}
          placeholder={t(EntityPlaceholdersI18nKey.Order)}
          value={route.order}
          min={0}
          onChange={onChangeOrder}
          errorText={orderError}
          invalid={!!orderError}
        />
        {route.order !== ORDER_DEFAULT_VALUE && (
          <DialPrimaryButton
            className="mb-2.5"
            appearance={ButtonAppearance.Link}
            label={t(ButtonsI18nKey.ResetToDefault)}
            iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onResetOrder}
          />
        )}
      </div>
    </div>
  );
};

export default RouteProperties;
