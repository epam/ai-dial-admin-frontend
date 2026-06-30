'use client';

import { FC, useCallback, useEffect, useState } from 'react';

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
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
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
  const { dispatch } = useSaveValidationContext();
  const isModelView = view === ApplicationRoute.Models;
  const isIdRequiredForResponses = !!endpoint.responsesEndpoint && !endpoint.id;
  const idValidationField = `upstream-id-${index}`;
  const [isExpanded, setIsExpanded] = useState(false);
  const [endpointWarning, setEndpointWarning] = useState('');
  const [responsesEndpointWarning, setResponsesEndpointWarning] = useState('');
  const isTablet = useIsTabletScreen();

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

  const onRemove = useCallback(() => {
    setEndpointWarning('');
    setResponsesEndpointWarning('');
    removeEndpoint(index);
  }, [index, removeEndpoint]);

  useEffect(() => {
    if (!isModelView) {
      return;
    }
    dispatch({ type: ValidationActionType.SetField, field: idValidationField, isValid: !isIdRequiredForResponses });

    return () => {
      dispatch({ type: ValidationActionType.RemoveField, field: idValidationField });
    };
  }, [dispatch, idValidationField, isModelView, isIdRequiredForResponses]);

  const onChangeExtraData = useCallback(
    (extraData: DialEndpointExtraData) => {
      updateEndpoint({ ...endpoint, extraData });
    },
    [endpoint, updateEndpoint],
  );

  const onChangeSecretExtraData = useCallback(
    (secretExtraData: DialEndpointExtraData) => {
      updateEndpoint({ ...endpoint, secretExtraData });
    },
    [endpoint, updateEndpoint],
  );

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <div className="flex gap-4 items-center w-full lg:gap-2 lg:bg-layer-3 lg:rounded lg:p-4">
      {/* Desktop toggle — left of content, mirrors delete button positioning */}
      {!isTablet && (
        <div className="shrink-0 self-start">
          <button
            type="button"
            className={'cursor-pointer block h-[40px] mt-[20px]'}
            onClick={toggleExpand}
            aria-label="toggle expanded fields"
          >
            {isExpanded ? (
              <IconChevronDown className="text-primary" {...BASE_BUTTON_ICON_PROPS} />
            ) : (
              <IconChevronRight className="text-primary" {...BASE_BUTTON_ICON_PROPS} />
            )}
          </button>
        </div>
      )}

      <div className="flex flex-1 min-w-0 flex-col rounded border border-primary p-3 lg:border-none lg:p-0">
        {isTablet && (
          <div className="flex flex-col justify-center cursor-pointer" onClick={toggleExpand}>
            <h3 className="small flex items-center">
              {!isExpanded ? (
                <IconChevronRight className="text-primary" {...BASE_BUTTON_ICON_PROPS} />
              ) : (
                <IconChevronDown className="text-primary" {...BASE_BUTTON_ICON_PROPS} />
              )}
              {t(UpstreamEndpointsI18nKey.Upstream)} {index + 1}
            </h3>
            {!isExpanded && (
              <DialTooltip tooltip={endpoint.endpoint || '—'}>
                <p className="max-w-[220px] truncate tiny text-secondary mt-3">{endpoint.endpoint || '—'}</p>
              </DialTooltip>
            )}
          </div>
        )}

        {/* Row 1: always visible on desktop; hidden when tablet is collapsed */}
        <div
          className={classNames(
            'flex flex-col mt-4 gap-y-4 lg:flex-row lg:gap-x-2 lg:mt-0',
            isTablet && !isExpanded && 'hidden',
          )}
        >
          {isModelView && (
            <DialInput
              disabled={disabled}
              id={`upstream-id-${index}`}
              value={endpoint.id}
              placeholder={t(EntityPlaceholdersI18nKey.UpstreamId)}
              labelProps={{ label: t(UpstreamEndpointsI18nKey.Id), required: !!endpoint.responsesEndpoint }}
              containerClassName={isTablet ? 'w-full' : 'w-[200px] shrink-0'}
              onChange={(id?: string) => updateEndpoint({ ...endpoint, id })}
              error={isIdRequiredForResponses ? t(ErrorI18nKey.RequiredField) : undefined}
              invalid={isIdRequiredForResponses}
            />
          )}

          <div className="w-full lg:flex-1">
            <EndpointControl
              disabled={disabled}
              id={`upstreamEndpoints-${index}`}
              endpoint={endpoint.endpoint}
              isFullWidth
              placeholder={
                !withResponses
                  ? t(EntityPlaceholdersI18nKey.UpstreamEndpoint)
                  : t(EntityPlaceholdersI18nKey.UpstreamEndpointWithResponses)
              }
              label={
                !withResponses
                  ? t(UpstreamEndpointsI18nKey.Endpoints)
                  : t(UpstreamEndpointsI18nKey.EndpointsWithResponses)
              }
              onChange={onChangeEndPointUrl}
              iconAfter={<WarningIcon warningText={endpointWarning} />}
              required={required}
            />
          </div>

          {withResponses && (
            <div className="w-full lg:flex-1">
              <EndpointControl
                disabled={disabled}
                id={`responses-${index}`}
                endpoint={endpoint.responsesEndpoint}
                isFullWidth
                placeholder={t(EntityPlaceholdersI18nKey.ResponsesEndpoint)}
                label={t(EntityFieldsI18nKey.responsesEndpoint)}
                onChange={onChangeResponses}
                iconAfter={<WarningIcon warningText={responsesEndpointWarning} />}
                required={required}
              />
            </div>
          )}

          {isTablet && (
            <DialPasswordInput
              disabled={disabled}
              id={`key-${index}`}
              value={endpoint.key}
              placeholder={t(EntityPlaceholdersI18nKey.UpstreamKey)}
              labelProps={{ label: t(UpstreamEndpointsI18nKey.Keys) }}
              required={!isKeyOptional}
              onChange={(key?: string) => updateEndpoint({ ...endpoint, key })}
            />
          )}

          <DialNumberInput
            id={`weight-${index}`}
            disabled={disabled}
            value={endpoint.weight}
            labelProps={{ label: t(EntityFieldsI18nKey.weight) }}
            containerClassName={isTablet ? 'w-full' : 'w-[120px] shrink-0'}
            placeholder={t(EntityPlaceholdersI18nKey.Weight)}
            onChange={(weight?: number | string) => updateEndpoint({ ...endpoint, weight })}
          />

          <DialNumberInput
            id={`tier-${index}`}
            disabled={disabled}
            value={endpoint.tier}
            labelProps={{ label: t(EntityFieldsI18nKey.tier) }}
            containerClassName={isTablet ? 'w-full' : 'w-[120px] shrink-0'}
            placeholder={t(EntityPlaceholdersI18nKey.Tier)}
            onChange={(tier?: number | string) => updateEndpoint({ ...endpoint, tier })}
          />

          {isTablet && (
            <>
              <ExtraDataField
                label={isTablet ? t(EntityFieldsI18nKey.extraData) : ''}
                value={endpoint.extraData}
                disabled={disabled}
                containerClassName="w-full"
                onChange={onChangeExtraData}
              />
              <ExtraDataField
                label={isTablet ? t(EntityFieldsI18nKey.secretExtraData) : ''}
                value={endpoint.secretExtraData}
                disabled={disabled}
                isSecret
                containerClassName="w-full"
                onChange={onChangeSecretExtraData}
              />
            </>
          )}
        </div>

        {/* Desktop expanded rows: row 2 (key full-width), row 3 (extraData + secretExtraData 50/50) */}
        {!isTablet && isExpanded && (
          <>
            <div className="mt-2 w-full">
              <DialPasswordInput
                disabled={disabled}
                id={`key-${index}`}
                value={endpoint.key}
                placeholder={t(EntityPlaceholdersI18nKey.UpstreamKey)}
                labelProps={{ label: t(UpstreamEndpointsI18nKey.Keys) }}
                required={!isKeyOptional}
                onChange={(key?: string) => updateEndpoint({ ...endpoint, key })}
              />
            </div>
            <div className="flex flex-row gap-x-2 mt-2 w-full">
              <ExtraDataField
                label={t(EntityFieldsI18nKey.extraData)}
                value={endpoint.extraData}
                disabled={disabled}
                containerClassName="flex-1 min-w-0"
                onChange={onChangeExtraData}
              />
              <ExtraDataField
                label={t(EntityFieldsI18nKey.secretExtraData)}
                value={endpoint.secretExtraData}
                disabled={disabled}
                isSecret
                containerClassName="flex-1 min-w-0"
                onChange={onChangeSecretExtraData}
              />
            </div>
          </>
        )}
      </div>
      {!disabled && (
        <div className="w-[40px] shrink-0 self-start">
          <DialRemoveButton onClick={onRemove} className={!isTablet ? 'mt-[20px]' : 'mt-0'} aria-label="remove" />
        </div>
      )}
    </div>
  );
};

export default Endpoint;
