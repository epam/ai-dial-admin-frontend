'use client';

import { FC, useCallback, useState } from 'react';

import { DialInput, DialNumberInput, DialPasswordInput, DialRemoveButton, DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import classNames from 'classnames';

import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import ExtraDataField from '@/src/components/UpstreamEndpoints/ExtraData/ExtraDataField';
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
import { ApplicationRoute } from '@/src/types/routes';
import { isDangerEndpoint } from '@/src/utils/validation/url-error';
import WarningIcon from '@/src/components/Common/WarningIcon/WarningIcon';

interface Props {
  index: number;
  disabled?: boolean;
  endpoint: DialModelEndpoint;
  isKeyOptional?: boolean;
  required?: boolean;
  view?: ApplicationRoute;
  withResponses?: boolean;
  updateEndpoint: (endpoint: DialModelEndpoint) => void;
  removeEndpoint: (index: number) => void;
}

const Endpoint: FC<Props> = ({
  disabled,
  index,
  endpoint,
  isKeyOptional,
  required,
  view,
  withResponses,
  updateEndpoint,
  removeEndpoint,
}) => {
  const t = useI18n();
  const isModelView = view === ApplicationRoute.Models;
  const isFirstLine = index === 0;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [endpointWarning, setEndpointWarning] = useState('');
  const [responsesEndpointWarning, setResponsesEndpointWarning] = useState('');
  const isTablet = useIsTabletScreen();

  const removeButtonClassName = index === 0 ? 'mt-[22px]' : 'mt-[-5px]';

  const onChangeEndPointUrl = useCallback(
    (url?: string) => {
      updateEndpoint({ ...endpoint, endpoint: url });
      setEndpointWarning(!url ? '' : isDangerEndpoint(url) ? t(ErrorI18nKey.WarningEndpoint) : '');
    },
    [endpoint, updateEndpoint, t],
  );

  const onChangeResponses = useCallback(
    (url?: string) => {
      updateEndpoint({ ...endpoint, responsesEndpoint: url });
      setResponsesEndpointWarning(!url ? '' : isDangerEndpoint(url) ? t(ErrorI18nKey.WarningEndpoint) : '');
    },
    [endpoint, updateEndpoint, t],
  );

  const onChangeId = useCallback(
    (id?: string) => {
      updateEndpoint({ ...endpoint, id });
    },
    [endpoint, updateEndpoint],
  );

  const onChangeKey = useCallback(
    (key?: string) => {
      updateEndpoint({ ...endpoint, key });
    },
    [endpoint, updateEndpoint],
  );

  const onRemove = useCallback(() => {
    setEndpointWarning('');
    setResponsesEndpointWarning('');
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
    <div className="flex gap-4 items-center lg:gap-2 w-full">
      <div className="flex flex-1 min-w-0 flex-col rounded border border-primary p-3 lg:border-none lg:p-0 lg:flex-initial">
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
                <p className="max-w-[220px] truncate tiny text-secondary mt-3">{endpoint.endpoint || '—'}</p>
              </DialTooltip>
            )}
          </div>
        )}
        <div
          className={classNames('flex flex-col mt-4 gap-y-4 lg:flex-row lg:gap-x-2 lg:mt-0', isCollapsed && 'hidden')}
        >
          {isModelView && (
            <DialInput
              disabled={disabled}
              id={`upstream-id-${index}`}
              value={endpoint.id}
              placeholder={t(EntityPlaceholdersI18nKey.UpstreamId)}
              labelProps={{ label: isFirstLine || isTablet ? t(UpstreamEndpointsI18nKey.Id) : '' }}
              containerClassName="w-[140px]"
              onChange={onChangeId}
            />
          )}

          <EndpointControl
            disabled={disabled}
            id={`upstreamEndpoints-${index}`}
            endpoint={endpoint.endpoint}
            placeholder={
              !withResponses
                ? t(EntityPlaceholdersI18nKey.UpstreamEndpoint)
                : t(EntityPlaceholdersI18nKey.UpstreamEndpointWithResponses)
            }
            label={
              isFirstLine || isTablet
                ? !withResponses
                  ? t(UpstreamEndpointsI18nKey.Endpoints)
                  : t(UpstreamEndpointsI18nKey.EndpointsWithResponses)
                : ''
            }
            onChange={onChangeEndPointUrl}
            iconAfter={<WarningIcon warningText={endpointWarning} />}
            required={required}
          />

          {withResponses && (
            <EndpointControl
              disabled={disabled}
              id={`responses-${index}`}
              endpoint={endpoint.responsesEndpoint}
              placeholder={t(EntityPlaceholdersI18nKey.ResponsesEndpoint)}
              caption={isFirstLine || isTablet ? t(UpstreamEndpointsI18nKey.EndpointResponseCaption) : ''}
              label={isFirstLine || isTablet ? t(EntityFieldsI18nKey.responsesEndpoint) : ''}
              onChange={onChangeResponses}
              iconAfter={<WarningIcon warningText={responsesEndpointWarning} />}
              required={required}
            />
          )}

          <DialPasswordInput
            disabled={disabled}
            id={`key-${index}`}
            value={endpoint.key}
            placeholder={t(EntityPlaceholdersI18nKey.UpstreamKey)}
            labelProps={{ label: isFirstLine || isTablet ? t(UpstreamEndpointsI18nKey.Keys) : '' }}
            required={!isKeyOptional}
            onChange={onChangeKey}
          />

          <DialNumberInput
            id={`weight-${index}`}
            disabled={disabled}
            value={endpoint.weight}
            labelProps={{ label: isFirstLine || isTablet ? t(EntityFieldsI18nKey.weight) : '' }}
            containerClassName="w-[120px]"
            placeholder={t(EntityPlaceholdersI18nKey.Weight)}
            onChange={onChangeWeight}
          />

          <DialNumberInput
            id={`tier-${index}`}
            disabled={disabled}
            value={endpoint.tier}
            labelProps={{ label: isFirstLine || isTablet ? t(EntityFieldsI18nKey.tier) : '' }}
            containerClassName="w-[120px]"
            placeholder={t(EntityPlaceholdersI18nKey.Tier)}
            onChange={onChangeTier}
          />

          <ExtraDataField
            label={isFirstLine || isTablet ? t(EntityFieldsI18nKey.extraData) : ''}
            endpoint={endpoint}
            disabled={disabled}
            onChangeExtraData={onChangeExtraData}
          />
        </div>
      </div>
      {!disabled && (
        <div className="w-[40px] shrink-0">
          <DialRemoveButton onClick={onRemove} className={removeButtonClassName} aria-label="remove" />
        </div>
      )}
    </div>
  );
};

export default Endpoint;
