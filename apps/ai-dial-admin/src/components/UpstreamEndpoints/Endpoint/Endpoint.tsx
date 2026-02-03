'use client';

import { FC, useCallback, useState } from 'react';

import { IconChevronDown, IconChevronRight, IconTrash, IconTrashX } from '@tabler/icons-react';
import classNames from 'classnames';
import { DialPasswordInputField, DialTooltip, DialNumberInputField } from '@epam/ai-dial-ui-kit';

import {
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  ErrorI18nKey,
  UpstreamEndpointsI18nKey,
} from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { DialEndpointExtraData, DialModelEndpoint } from '@/src/models/dial/model';
import { isDangerEndpoint } from '@/src/utils/validation/url-error';
import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import ExtraDataField from '../ExtraData/ExtraDataField';
import WarningIcon from './WarningIcon';

interface Props {
  index: number;
  readonly?: boolean;
  numEndpoints: number;
  endpoint: DialModelEndpoint;
  isKeyOptional?: boolean;
  required?: boolean;
  updateEndpoint: (endpoint: DialModelEndpoint) => void;
  removeEndpoint: (index: number) => void;
}

const Endpoint: FC<Props> = ({
  readonly,
  index,
  endpoint,
  isKeyOptional,
  required,
  numEndpoints,
  updateEndpoint,
  removeEndpoint,
}) => {
  const t = useI18n();
  const isFirstLine = index === 0;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [endpointWarning, setEndpointWarning] = useState('');
  const isTablet = useIsTabletScreen();

  const onChangeEndPointUrl = useCallback(
    (url?: string) => {
      updateEndpoint({ ...endpoint, endpoint: url });

      setEndpointWarning(!url ? '' : isDangerEndpoint(url) ? t(ErrorI18nKey.WarningEndpoint) : '');
    },
    [endpoint, updateEndpoint, t],
  );

  const onChangeKey = useCallback(
    (key?: string) => {
      updateEndpoint({ ...endpoint, key });
    },
    [endpoint, updateEndpoint],
  );

  const onRemove = useCallback(() => {
    setEndpointWarning('');
    removeEndpoint(index);
  }, [index, removeEndpoint]);

  const onChangeWeight = useCallback(
    (weight?: number | string) => {
      updateEndpoint({ ...endpoint, weight });
    },
    [endpoint, updateEndpoint],
  );

  const onChangeTier = useCallback(
    (tier?: number | string) => {
      updateEndpoint({ ...endpoint, tier });
    },
    [endpoint, updateEndpoint],
  );

  const onChangeExtraData = useCallback(
    (extraData: DialEndpointExtraData) => {
      updateEndpoint({ ...endpoint, extraData });
    },
    [endpoint, updateEndpoint],
  );

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="flex gap-4 items-start lg:gap-2 w-full">
      <div className="flex flex-1 flex-col rounded border border-primary p-3 lg:border-none lg:p-0 lg:flex-initial">
        {isTablet && (
          <div className="flex flex-col justify-center cursor-pointer" onClick={toggleCollapse}>
            <h3 className="small flex items-center">
              {isCollapsed ? (
                <IconChevronRight className="text-primary" {...BASE_BUTTON_ICON_PROPS} />
              ) : (
                <IconChevronDown className="text-primary" {...BASE_BUTTON_ICON_PROPS} />
              )}
              {t(UpstreamEndpointsI18nKey.Upstream)} {index + 1}
            </h3>
            {isCollapsed && (
              <DialTooltip tooltip={endpoint.endpoint || '—'}>
                <p className="max-w-[220px] md:max-w-[50%] truncate tiny text-secondary mt-3">
                  {endpoint.endpoint || '—'}
                </p>
              </DialTooltip>
            )}
          </div>
        )}
        <div
          className={classNames('flex flex-col mt-4 gap-y-4 lg:flex-row lg:gap-x-2 lg:mt-0', isCollapsed && 'hidden')}
        >
          <EndpointControl
            disabled={readonly}
            id={`upstreamEndpoints-${index}`}
            endpoint={endpoint.endpoint}
            elementClassName="h-[40px]"
            placeholder={t(EntityPlaceholdersI18nKey.UpstreamEndpoint)}
            fieldTitle={isFirstLine || isTablet ? t(UpstreamEndpointsI18nKey.Endpoints) : ''}
            onChange={onChangeEndPointUrl}
            iconAfterInput={<WarningIcon endpointWarning={endpointWarning} />}
            required={required}
          />

          <DialPasswordInputField
            disabled={readonly}
            elementId={`key-${index}`}
            value={endpoint.key}
            placeholder={t(EntityPlaceholdersI18nKey.UpstreamKey)}
            fieldTitle={isFirstLine || isTablet ? t(UpstreamEndpointsI18nKey.Keys) : ''}
            optional={isKeyOptional}
            onChange={onChangeKey}
          />

          <DialNumberInputField
            elementId={`weight-${index}`}
            disabled={readonly}
            value={endpoint.weight}
            fieldTitle={isFirstLine || isTablet ? t(EntityFieldsI18nKey.weight) : ''}
            containerClassName="w-[120px]"
            elementClassName="h-[40px]"
            placeholder={t(EntityPlaceholdersI18nKey.Weight)}
            onChange={onChangeWeight}
          />

          <DialNumberInputField
            elementId={`tier-${index}`}
            disabled={readonly}
            value={endpoint.tier}
            fieldTitle={isFirstLine || isTablet ? t(EntityFieldsI18nKey.tier) : ''}
            containerClassName="w-[120px]"
            elementClassName="h-[40px]"
            placeholder={t(EntityPlaceholdersI18nKey.Tier)}
            onChange={onChangeTier}
          />

          <ExtraDataField
            fieldTitle={isFirstLine || isTablet ? t(EntityFieldsI18nKey.extraData) : ''}
            endpoint={endpoint}
            disabled={readonly}
            onChangeExtraData={onChangeExtraData}
          />
        </div>
      </div>
      {(numEndpoints !== 1 || Object.keys(endpoint).length !== 0) && !readonly && (
        <button
          className={classNames('text-error cursor-pointer mt-[10px]', index === 0 && !isTablet && 'lg:mt-[32px]')}
          onClick={onRemove}
          aria-label="remove"
        >
          {isTablet ? (
            <IconTrashX {...BASE_BUTTON_ICON_PROPS} className="text-primary" />
          ) : (
            <IconTrash {...BASE_BUTTON_ICON_PROPS} />
          )}
        </button>
      )}
    </div>
  );
};

export default Endpoint;
