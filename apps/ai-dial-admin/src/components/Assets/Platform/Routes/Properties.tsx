'use client';

import {
  ButtonAppearance,
  DialInput,
  DialNumberInput,
  DialPrimaryButton,
  DialRadioGroup,
  DialSwitch,
  RadioButtonWithContent,
  RadioGroupOrientation,
} from '@epam/ai-dial-ui-kit';
import { IconRefresh } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useCallback, useMemo, useState } from 'react';

import UpstreamSecretWarning from '@/src/components/Assets/Platform/Models/UpstreamSecretWarning';
import ResourceInfoHeader from '@/src/components/Assets/Resources/ResourceInfoHeader';
import MaxRetryAttempts from '@/src/components/BaseControls/MaxRetryAttempts';
import Divider from '@/src/components/Common/Divider/Divider';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import Paths from '@/src/components/Routes/Paths/Paths';
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
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialRouteResource } from '@/src/models/dial/resource';
import { AttachmentPaths, RouteOutput } from '@/src/models/dial/route';

interface Props {
  asset: DialRouteResource;
  originalAsset: DialRouteResource;
  onChange: (asset: DialRouteResource) => void;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'];

const RouteAssetProperties: FC<Props> = ({ asset, originalAsset, onChange }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const outputRadio: RadioButtonWithContent[] = [
    { id: RouteOutput.UPSTREAMS, name: t(EntityFieldsI18nKey.upstreams) },
    { id: RouteOutput.RESPONSE, name: t(EntityFieldsI18nKey.response) },
  ];

  const [statusError, setStatusError] = useState('');
  const [bodyError, setBodyError] = useState('');

  const isUpstreamsRequired = !asset.response;

  const onChangePaths = useCallback(
    (paths: string[]) => {
      onChange({ ...asset, paths });
    },
    [asset, onChange],
  );

  const onChangeRewritePath = useCallback(
    (rewritePath: boolean) => {
      onChange({ ...asset, rewritePath });
    },
    [asset, onChange],
  );

  const onChangeMethods = useCallback(
    (methods: string[]) => {
      onChange({ ...asset, methods });
    },
    [asset, onChange],
  );

  const onChangeOutput = useCallback(
    (output: string) => {
      onChange({
        ...asset,
        upstreams: [],
        response: output === RouteOutput.RESPONSE ? { status: void 0, body: '' } : undefined,
      });
      setStatusError(output === RouteOutput.RESPONSE ? t(ErrorI18nKey.RequiredField) : '');
      setBodyError(output === RouteOutput.RESPONSE ? t(ErrorI18nKey.RequiredField) : '');
    },
    [asset, t, onChange],
  );

  const onChangeStatus = useCallback(
    (status?: number | string) => {
      onChange({ ...asset, response: { ...asset.response, status } });
      setStatusError(status && +status >= 100 && +status <= 999 ? '' : t(ErrorI18nKey.InvalidStatus));
    },
    [asset, onChange, t],
  );

  const onChangeBody = useCallback(
    (body?: string) => {
      onChange({ ...asset, response: { ...asset.response, body } });
      setBodyError(body ? '' : t(ErrorI18nKey.RequiredField));
    },
    [asset, t, onChange],
  );

  const onChangeOrder = useCallback(
    (order?: string | number) => {
      onChange({ ...asset, order: order ? +order : undefined });
    },
    [asset, onChange],
  );

  const onResetOrder = useCallback(() => {
    onChange({ ...asset, order: ORDER_DEFAULT_VALUE });
  }, [asset, onChange]);

  const onChangeRequestAttachmentPaths = useCallback(
    (requestBody: string[]) => {
      onChange({ ...asset, attachmentPaths: { ...asset.attachmentPaths, requestBody } as AttachmentPaths });
    },
    [asset, onChange],
  );

  const onChangeResponseAttachmentPaths = useCallback(
    (responseBody: string[]) => {
      onChange({ ...asset, attachmentPaths: { ...asset.attachmentPaths, responseBody } as AttachmentPaths });
    },
    [asset, onChange],
  );

  const paths = useMemo(() => (asset.paths?.length ? asset.paths : ['']), [asset.paths]);

  const requestAttachmentPaths = useMemo(
    () => (asset.attachmentPaths?.requestBody?.length ? asset.attachmentPaths.requestBody : ['']),
    [asset.attachmentPaths?.requestBody],
  );
  const responseAttachmentPaths = useMemo(
    () => (asset.attachmentPaths?.responseBody?.length ? asset.attachmentPaths.responseBody : ['']),
    [asset.attachmentPaths?.responseBody],
  );

  return (
    <div className="flex flex-col">
      <ResourceInfoHeader entity={asset} />
      <div className="flex flex-col gap-y-8 mt-8">
        <Paths
          label={t(EntityFieldsI18nKey.paths)}
          paths={paths}
          onChangePaths={onChangePaths}
          required
          disabled={isReadOnlyAdmin}
          trackGlobalValidity={false}
        />
        <DialSwitch
          isOn={asset.rewritePath}
          label={t(EntityFieldsI18nKey.rewritePath)}
          switchId="rewritePath"
          disabled={isReadOnlyAdmin}
          onChange={onChangeRewritePath}
        />
        <Multiselect
          elementId="methods"
          disabled={isReadOnlyAdmin}
          selectedItems={asset.methods}
          onChangeItems={onChangeMethods}
          heading={t(EntityFieldsI18nKey.methods)}
          label={t(EntityFieldsI18nKey.methods)}
          allItems={HTTP_METHODS}
          className={STANDARD_CONTROL_WIDTH}
          errorText={asset.methods?.length ? '' : t(ErrorI18nKey.EmptyField)}
        />
        <DialRadioGroup
          radioButtons={outputRadio}
          activeRadioButton={asset.response ? outputRadio[1].id : outputRadio[0].id}
          elementId="output"
          disabled={isReadOnlyAdmin}
          fieldTitle={t(RoutesI18nKey.Output)}
          orientation={RadioGroupOrientation.Row}
          onChange={onChangeOutput}
        />
        <div className={classNames('flex gap-x-2 flex-row', STANDARD_CONTROL_WIDTH, !asset.response && 'hidden')}>
          <DialNumberInput
            disabled={isReadOnlyAdmin}
            id="status"
            containerClassName="w-[150px]"
            labelProps={{ label: t(EntityFieldsI18nKey.status) }}
            placeholder={t(EntityPlaceholdersI18nKey.Status)}
            value={asset.response?.status}
            onChange={onChangeStatus}
            error={statusError}
            invalid={!!statusError}
          />
          <DialInput
            disabled={isReadOnlyAdmin}
            id="body"
            containerClassName="flex-1"
            labelProps={{ label: t(EntityFieldsI18nKey.body) }}
            placeholder={t(EntityPlaceholdersI18nKey.Body)}
            value={asset.response?.body}
            onChange={onChangeBody}
            error={bodyError}
            invalid={!!bodyError}
          />
        </div>
        <div className={classNames(asset.response && 'hidden')}>
          <UpstreamSecretWarning originalUpstreams={originalAsset.upstreams} editedUpstreams={asset.upstreams} />
          <UpstreamEndpoints
            disabled={isReadOnlyAdmin}
            entity={asset}
            onChangeEntity={onChange}
            required={isUpstreamsRequired}
            collapsible={false}
          />
        </div>
        <MaxRetryAttempts entity={asset} onChangeEntity={onChange} />
        <div className={classNames('flex gap-x-2 flex-row items-end', STANDARD_CONTROL_WIDTH)}>
          <DialNumberInput
            id="order"
            disabled={isReadOnlyAdmin}
            containerClassName="w-1/2"
            labelProps={{ label: t(EntityFieldsI18nKey.order) }}
            placeholder={t(EntityPlaceholdersI18nKey.Order)}
            value={asset.order}
            min={0}
            onChange={onChangeOrder}
          />
          {asset.order !== ORDER_DEFAULT_VALUE && !isReadOnlyAdmin && (
            <DialPrimaryButton
              className="h-10"
              appearance={ButtonAppearance.Link}
              label={t(ButtonsI18nKey.ResetToDefault)}
              iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} />}
              onClick={onResetOrder}
            />
          )}
        </div>
        <Divider />
        <Paths
          label={t(RoutesI18nKey.RequestAttachmentPaths)}
          paths={requestAttachmentPaths}
          disabled={isReadOnlyAdmin}
          onChangePaths={onChangeRequestAttachmentPaths}
          disableValidation
        />
        <Paths
          label={t(RoutesI18nKey.ResponseAttachmentPaths)}
          paths={responseAttachmentPaths}
          disabled={isReadOnlyAdmin}
          onChangePaths={onChangeResponseAttachmentPaths}
          disableValidation
        />
      </div>
    </div>
  );
};

export default RouteAssetProperties;
