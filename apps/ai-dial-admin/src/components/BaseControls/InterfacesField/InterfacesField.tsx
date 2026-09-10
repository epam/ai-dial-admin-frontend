'use client';

import { useCallback, useMemo, useState } from 'react';

import { DialGhostButton, DialLabel, DialSelectField, DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle, IconPlus } from '@tabler/icons-react';
import classNames from 'classnames';

import { ButtonsI18nKey, InterfacesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DeploymentInterfaceType, InterfaceFieldVariant } from '@/src/models/dial/interfaces';
import { DialUpstreamInterface } from '@/src/models/dial/model';
import InterfaceEndpointRow from './InterfaceEndpointRow';
import InterfaceRow from './InterfaceRow';

type BaseUrlInterfaceValue = { baseUrl?: string; base_url?: string };
type InterfaceValue = BaseUrlInterfaceValue | DialUpstreamInterface;

interface Props<V extends InterfaceValue> {
  interfaces?: Record<string, V>;
  onChangeInterfaces: (interfaces: Record<string, V>) => void;
  allowedTypes: DeploymentInterfaceType[];
  variant?: InterfaceFieldVariant;
  isAsset?: boolean;
  disabled?: boolean;
  className?: string;
}

export const getInterfaceTypeLabel = (t: ReturnType<typeof useI18n>, type: DeploymentInterfaceType): string => {
  switch (type) {
    case DeploymentInterfaceType.OpenAIChatCompletions:
      return t(InterfacesI18nKey.OpenAIChatCompletions);
    case DeploymentInterfaceType.OpenAIResponses:
      return t(InterfacesI18nKey.OpenAIResponses);
    case DeploymentInterfaceType.AnthropicMessages:
      return t(InterfacesI18nKey.AnthropicMessages);
    case DeploymentInterfaceType.OpenAIEmbeddings:
      return t(InterfacesI18nKey.OpenAIEmbeddings);
  }
};

const InterfacesField = <V extends InterfaceValue>({
  interfaces: interfacesProp,
  onChangeInterfaces,
  allowedTypes,
  variant = InterfaceFieldVariant.BaseUrl,
  isAsset,
  disabled,
  className,
}: Props<V>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isReadonly = disabled || isReadOnlyAdmin;
  const isEndpointVariant = variant === InterfaceFieldVariant.Endpoint;
  const baseUrlKey = isAsset ? 'base_url' : 'baseUrl';

  const [isSelectingType, setIsSelectingType] = useState(false);

  const interfaces = useMemo(() => interfacesProp || {}, [interfacesProp]);
  const usedTypes = Object.keys(interfaces) as DeploymentInterfaceType[];
  const availableTypes = allowedTypes.filter((type) => !usedTypes.includes(type));

  const createEmptyValue = useCallback(
    (): V => (isEndpointVariant ? { endpoint: '' } : { [baseUrlKey]: '' }) as V,
    [isEndpointVariant, baseUrlKey],
  );

  const onAddType = useCallback(
    (type: DeploymentInterfaceType) => {
      onChangeInterfaces({ ...interfaces, [type]: createEmptyValue() });
      setIsSelectingType(false);
    },
    [interfaces, createEmptyValue, onChangeInterfaces],
  );

  const onAddClick = useCallback(() => {
    if (allowedTypes.length === 1) {
      onAddType(allowedTypes[0]);
    } else {
      setIsSelectingType(true);
    }
  }, [allowedTypes, onAddType]);

  const onChangeValue = useCallback(
    (type: string, value: V) => {
      onChangeInterfaces({ ...interfaces, [type]: value });
    },
    [interfaces, onChangeInterfaces],
  );

  const onDeleteType = useCallback(
    (type: string) => {
      const updated = { ...interfaces };
      delete updated[type];
      onChangeInterfaces(updated);
    },
    [interfaces, onChangeInterfaces],
  );

  const showAddButton = availableTypes.length > 0 && !isSelectingType;

  return (
    <div className={classNames('flex flex-col gap-y-2')}>
      <div className="flex items-center gap-x-2">
        <DialLabel label={t(InterfacesI18nKey.Interfaces)} />
        <DialTooltip
          tooltip={
            <div className="flex flex-col gap-1">
              <div>{isEndpointVariant ? t(InterfacesI18nKey.InfoEndpoint) : t(InterfacesI18nKey.InfoBaseUrl)}</div>
            </div>
          }
        >
          <IconInfoCircle {...BASE_BUTTON_ICON_PROPS} className="text-secondary" />
        </DialTooltip>
      </div>

      <div
        className={classNames(
          'flex flex-col gap-y-2 rounded border border-primary p-4',
          className ?? STANDARD_CONTROL_WIDTH,
        )}
      >
        {usedTypes.map((type) =>
          isEndpointVariant ? (
            <InterfaceEndpointRow
              key={type}
              fieldId={`interface-${type}`}
              typeLabel={getInterfaceTypeLabel(t, type)}
              value={(interfaces[type] as DialUpstreamInterface) || {}}
              disabled={isReadonly}
              onChange={(value) => onChangeValue(type, value as V)}
              onDelete={() => onDeleteType(type)}
            />
          ) : (
            <InterfaceRow
              key={type}
              fieldId={`interface-${type}`}
              typeLabel={getInterfaceTypeLabel(t, type)}
              baseUrl={(interfaces[type] as BaseUrlInterfaceValue)?.[baseUrlKey] || ''}
              disabled={isReadonly}
              onChangeBaseUrl={(value) => onChangeValue(type, { ...interfaces[type], [baseUrlKey]: value } as V)}
              onDelete={() => onDeleteType(type)}
            />
          ),
        )}

        {!isReadonly && isSelectingType && (
          <DialSelectField
            id="interfaceType"
            containerClassName="max-w-[300px]"
            placeholder={t(InterfacesI18nKey.SelectType)}
            options={availableTypes.map((type) => ({ value: type, label: getInterfaceTypeLabel(t, type) }))}
            value=""
            onChange={(value) => onAddType(value as DeploymentInterfaceType)}
          />
        )}

        {!isReadonly && showAddButton && (
          <div>
            <DialGhostButton
              iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
              label={t(ButtonsI18nKey.AddInterface)}
              onClick={onAddClick}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InterfacesField;
