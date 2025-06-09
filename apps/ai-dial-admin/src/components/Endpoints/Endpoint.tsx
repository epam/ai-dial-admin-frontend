'use client';

import { FC, useCallback, useState } from 'react';

import { IconAlertTriangleFilled, IconChevronDown, IconChevronRight, IconTrash, IconTrashX } from '@tabler/icons-react';
import classNames from 'classnames';

import { NumberInputField, TextInputField } from '@/src/components/Common/InputField/InputField';
import PasswordInputField from '@/src/components/Common/PasswordInput/PasswordInputField';
import Tooltip from '@/src/components/Common/Tooltip/Tooltip';
import { ErrorI18nKey, UpstreamEndpointsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { DialEndpointExtraData, DialModelEndpoint } from '@/src/models/dial/model';
import { isDangerEndpoint, isValidEndpoint } from '@/src/utils/validation/is-valid-url';
import ExtraDataField from './ExtraData/ExtraDataField';

interface Props {
  index: number;
  numEndpoints: number;
  endpoint: DialModelEndpoint;
  isKeyOptional?: boolean;
  updateEndpoint: (endpoint: DialModelEndpoint) => void;
  removeEndpoint: (index: number) => void;
}

const Endpoint: FC<Props> = ({ index, endpoint, isKeyOptional, numEndpoints, updateEndpoint, removeEndpoint }) => {
  const t = useI18n();
  const isFirstLine = index === 0;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [endpointError, setEndpointError] = useState('');
  const [endpointWarning, setEndpointWarning] = useState('');
  const isTablet = useIsTabletScreen();

  const onChangeEndPointUrl = useCallback(
    (url: string) => {
      updateEndpoint({ ...endpoint, endpoint: url });
      setEndpointError(url === '' ? '' : isValidEndpoint(url) ? '' : t(ErrorI18nKey.IncorrectEndpoint));
      setEndpointWarning(url === '' ? '' : isDangerEndpoint(url) ? t(ErrorI18nKey.WarningEndpoint) : '');
    },
    [endpoint, updateEndpoint, t],
  );

  const onChangeKey = useCallback(
    (key: string) => {
      updateEndpoint({ ...endpoint, key });
    },
    [endpoint, updateEndpoint],
  );

  const onRemove = useCallback(() => {
    setEndpointError('');
    setEndpointWarning('');
    removeEndpoint(index);
  }, [index, removeEndpoint]);

  const onChangeWeight = useCallback(
    (weight: number | string) => {
      updateEndpoint({ ...endpoint, weight });
    },
    [endpoint, updateEndpoint],
  );

  const onChangeTier = useCallback(
    (tier: number | string) => {
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
    <div className="flex gap-4 items-start lg:gap-2">
      <div className="flex flex-1 flex-col rounded border border-primary p-3 lg:border-none lg:p-0 lg:flex-initial">
        {isTablet && (
          <div className="flex flex-col justify-center cursor-pointer" onClick={toggleCollapse}>
            <h3 className="small flex items-center">
              <i className="text-icon-primary mr-2 ">
                {isCollapsed ? <IconChevronRight {...BASE_ICON_PROPS} /> : <IconChevronDown {...BASE_ICON_PROPS} />}
              </i>
              {t(UpstreamEndpointsI18nKey.Upstream)} {index + 1}
            </h3>
            {isCollapsed && (
              <p className="max-w-[220px] md:max-w-[50%] truncate tiny text-secondary mt-3">
                {endpoint.endpoint || '—'}
              </p>
            )}
          </div>
        )}
        <div
          className={classNames('flex flex-col mt-4 gap-y-4 lg:flex-row lg:gap-x-2 lg:mt-0', isCollapsed && 'hidden')}
        >
          <TextInputField
            elementId={'upstreamEndpoints ' + index}
            value={endpoint.endpoint}
            placeholder={t(UpstreamEndpointsI18nKey.UpstreamEndpointsPlaceholder)}
            fieldTitle={isFirstLine || isTablet ? t(UpstreamEndpointsI18nKey.UpstreamEndpoints) : ''}
            containerCssClass="lg:w-[560px]"
            elementCssClass="h-[38px]"
            errorText={endpointError}
            invalid={!!endpointError}
            onChange={onChangeEndPointUrl}
            iconAfterInput={
              <Tooltip tooltip={endpointWarning} placement={'bottom'}>
                <IconAlertTriangleFilled
                  fill="#F4CE46"
                  {...BASE_ICON_PROPS}
                  className={endpointWarning ? '' : 'hidden'}
                />
              </Tooltip>
            }
          />

          <PasswordInputField
            elementId={'key ' + index}
            value={endpoint.key}
            placeholder={t(UpstreamEndpointsI18nKey.UpstreamKeyPlaceholder)}
            fieldTitle={isFirstLine || isTablet ? t(UpstreamEndpointsI18nKey.UpstreamKey) : ''}
            optional={isKeyOptional}
            onChange={onChangeKey}
          />

          <NumberInputField
            elementId={'weight ' + index}
            value={endpoint.weight}
            fieldTitle={isFirstLine || isTablet ? t(UpstreamEndpointsI18nKey.Weight) : ''}
            containerCssClass="w-[120px]"
            elementCssClass="h-[38px]"
            placeholder={t(UpstreamEndpointsI18nKey.WeightPlaceholder)}
            onChange={onChangeWeight}
          />

          <NumberInputField
            elementId={'tier ' + index}
            value={endpoint.tier}
            fieldTitle={isFirstLine || isTablet ? t(UpstreamEndpointsI18nKey.Tier) : ''}
            containerCssClass="w-[120px]"
            elementCssClass="h-[38px]"
            placeholder={t(UpstreamEndpointsI18nKey.TierPlaceholder)}
            onChange={onChangeTier}
          />

          <ExtraDataField
            fieldTitle={isFirstLine || isTablet ? t(UpstreamEndpointsI18nKey.ExtraDataTitle) : ''}
            endpoint={endpoint}
            onChangeExtraData={onChangeExtraData}
          />
        </div>
      </div>
      {(numEndpoints !== 1 || Object.keys(endpoint).length !== 0) && (
        <button
          className={classNames('text-error cursor-pointer mt-[10px]', index === 0 && !isTablet && 'lg:mt-[32px]')}
          onClick={onRemove}
          aria-label="remove"
        >
          {isTablet ? <IconTrashX {...BASE_ICON_PROPS} className="text-primary" /> : <IconTrash {...BASE_ICON_PROPS} />}
        </button>
      )}
    </div>
  );
};

export default Endpoint;
