import {
  ButtonAppearance,
  DialInput,
  DialNumberInput,
  DialPrimaryButton,
  DialRadioGroup,
  DialSelectField,
  DialSwitch,
  RadioButtonWithContent,
  RadioGroupOrientation,
  SelectOption,
} from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import MaxRetryAttempts from '@/src/components/BaseControls/MaxRetryAttempts';
import TopicsControl from '@/src/components/BaseControls/Topics';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import Paths from '@/src/components/Routes/Paths/Paths';
import { handleRouteOutputChange } from '@/src/components/Routes/utils';
import UpstreamEndpoints from '@/src/components/UpstreamEndpoints/UpstreamEndpoints';
import {
  ButtonsI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  ErrorI18nKey,
  RoutesI18nKey,
} from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { ORDER_DEFAULT_VALUE } from '@/src/constants/routes';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialAppRoute, DialRoute, RouteOutput, RoutePermission } from '@/src/models/dial/route';
import { IconRefresh } from '@tabler/icons-react';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';

interface Props {
  route: DialRoute | DialAppRoute;
  isAppRoute?: boolean;
  disabled?: boolean;
  routeNames?: string[];
  onChange: (route: DialRoute | DialAppRoute) => void;
  isAppRunnerView?: boolean;
  useAggregateRouteValidation?: boolean;
}

const RouteProperties: FC<Props> = ({
  route,
  disabled,
  isAppRoute,
  routeNames,
  onChange,
  isAppRunnerView,
  useAggregateRouteValidation,
}) => {
  const t = useI18n();
  const { dispatch, resetCounter } = useSaveValidationContext();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  // When true, all field-level validation is delegated to EntityRoutes aggregate key
  const skipGlobalValidation = !!(isAppRoute && (isAppRunnerView || useAggregateRouteValidation));

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

  const methods = useMemo(() => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'], []);

  const [statusError, setStatusError] = useState('');
  const [bodyError, setBodyError] = useState('');
  const [orderError, setOrderError] = useState('');

  const [isUpstreamsRequired, setIsUpstreamsRequired] = useState(!route.response);

  useEffect(() => {
    if (skipGlobalValidation) return;
    dispatch({ type: ValidationActionType.SetField, field: 'status', isValid: !statusError });
  }, [dispatch, statusError, skipGlobalValidation]);

  useEffect(() => {
    if (skipGlobalValidation) return;
    dispatch({ type: ValidationActionType.SetField, field: 'body', isValid: !bodyError });
  }, [dispatch, bodyError, skipGlobalValidation]);

  useEffect(() => {
    if (skipGlobalValidation) return;
    dispatch({ type: ValidationActionType.SetField, field: 'methods', isValid: !!route.methods?.length });
  }, [dispatch, route.methods, skipGlobalValidation]);

  useEffect(() => {
    if (resetCounter) {
      setStatusError('');
      setBodyError('');
    }
  }, [resetCounter]);

  useEffect(() => {
    if (isAppRoute && !skipGlobalValidation) {
      dispatch({
        type: ValidationActionType.SetField,
        field: 'endpoints',
        isValid: !!route.response || !!route.upstreams?.length,
      });
    }
  }, [isAppRoute, dispatch, route.upstreams?.length, route.response, skipGlobalValidation]);

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
      if (!skipGlobalValidation) {
        dispatch({ type: ValidationActionType.SetField, field: 'order', isValid: !!order });
      }
      setOrderError(order ? '' : t(ErrorI18nKey.RequiredField));
    },
    [route, onChange, dispatch, t, skipGlobalValidation],
  );

  const onResetOrder = useCallback(() => {
    onChange({
      ...route,
      order: ORDER_DEFAULT_VALUE,
    });
    if (!skipGlobalValidation) {
      dispatch({ type: ValidationActionType.SetField, field: 'order', isValid: true });
    }
    setOrderError('');
  }, [route, onChange, dispatch, skipGlobalValidation]);

  return (
    <div className="flex flex-col size-full gap-y-8">
      <DisplayNameControl
        displayName={isAppRoute ? route.name : route.displayName}
        required
        isFullWidth={false}
        onChange={onChangeDisplayName}
        disabled={disabled}
        names={isAppRoute ? routeNames || [] : void 0}
        allowWhitespace={!isAppRoute}
        alphanumericOnly={isAppRoute && isAppRunnerView}
        trackGlobalValidity={!skipGlobalValidation}
      />
      {!isAppRoute && <DescriptionControl entity={route} onChangeEntity={onChange} isFullWidth={false} />}
      <Paths
        label={t(EntityFieldsI18nKey.paths)}
        paths={route.paths}
        onChangePaths={onChangePaths}
        required
        disabled={disabled || isReadOnlyAdmin}
        trackGlobalValidity={!skipGlobalValidation}
      />
      <DialSwitch
        isOn={route.rewritePath}
        label={t(EntityFieldsI18nKey.rewritePath)}
        switchId="rewritePath"
        disabled={disabled || isReadOnlyAdmin}
        onChange={onChangeRewritePath}
      />
      <Multiselect
        elementId="methods"
        disabled={disabled || isReadOnlyAdmin}
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
        disabled={disabled || isReadOnlyAdmin}
        fieldTitle={t(RoutesI18nKey.Output)}
        orientation={RadioGroupOrientation.Row}
        onChange={onChangeOutput}
      />
      <div className={classNames('flex gap-x-2 flex-row', STANDARD_CONTROL_WIDTH, !route.response && 'hidden')}>
        <DialNumberInput
          disabled={disabled || isReadOnlyAdmin}
          id="status"
          containerClassName="w-[150px]"
          labelProps={{ label: t(EntityFieldsI18nKey.status) }}
          placeholder={t(EntityPlaceholdersI18nKey.Status)}
          value={route.response?.status}
          onChange={onChangeStatus}
          error={statusError}
          invalid={!!statusError}
        />
        <DialInput
          disabled={disabled || isReadOnlyAdmin}
          id="body"
          containerClassName="flex-1"
          labelProps={{ label: t(EntityFieldsI18nKey.body) }}
          placeholder={t(EntityPlaceholdersI18nKey.Body)}
          value={route.response?.body}
          onChange={onChangeBody}
          error={bodyError}
          invalid={!!bodyError}
        />
      </div>

      <div className={classNames(route.response && 'hidden')}>
        <UpstreamEndpoints
          disabled={disabled || isReadOnlyAdmin}
          entity={route}
          onChangeEntity={onChange}
          required={isUpstreamsRequired}
          collapsible={false}
        />
      </div>
      <MaxRetryAttempts disabled={disabled} entity={route} onChangeEntity={onChange} />
      {isAppRoute && (
        <DialSelectField
          disabled={disabled || isReadOnlyAdmin}
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
      <div
        className={classNames(
          'flex gap-x-2 flex-row items-end',
          STANDARD_CONTROL_WIDTH,
          orderError ? 'items-center' : 'items-end',
        )}
      >
        <DialNumberInput
          id="order"
          disabled={disabled || isReadOnlyAdmin}
          containerClassName="w-1/2"
          labelProps={{ label: t(EntityFieldsI18nKey.order) }}
          placeholder={t(EntityPlaceholdersI18nKey.Order)}
          value={route.order}
          min={0}
          onChange={onChangeOrder}
          error={orderError}
          invalid={!!orderError}
        />
        {route.order !== ORDER_DEFAULT_VALUE && !isReadOnlyAdmin && (
          <DialPrimaryButton
            className="h-10"
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
