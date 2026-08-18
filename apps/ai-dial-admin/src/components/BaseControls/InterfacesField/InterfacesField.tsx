'use client';

import { useCallback, useMemo, useState } from 'react';

import { DialGhostButton, DialLabel, DialSelectField, DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle, IconPlus } from '@tabler/icons-react';
import classNames from 'classnames';

import { ButtonsI18nKey, InterfacesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';
import InterfaceRow from './InterfaceRow';

type InterfaceValueMap = Record<string, { baseUrl?: string; base_url?: string }>;

interface Props<T extends { interfaces?: InterfaceValueMap }> {
  entity: T;
  onChangeEntity: (entity: T) => void;
  allowedTypes: DeploymentInterfaceType[];
  isAsset?: boolean;
  disabled?: boolean;
}

const getInterfaceTypeLabel = (t: ReturnType<typeof useI18n>, type: DeploymentInterfaceType): string => {
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

const InterfacesField = <T extends { interfaces?: InterfaceValueMap }>({
  entity,
  onChangeEntity,
  allowedTypes,
  isAsset,
  disabled,
}: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isReadonly = disabled || isReadOnlyAdmin;
  const baseUrlKey = isAsset ? 'base_url' : 'baseUrl';

  const [isSelectingType, setIsSelectingType] = useState(false);

  const interfaces = useMemo(() => entity.interfaces || {}, [entity.interfaces]);
  const usedTypes = Object.keys(interfaces) as DeploymentInterfaceType[];
  const availableTypes = allowedTypes.filter((type) => !usedTypes.includes(type));

  const onAddType = useCallback(
    (type: DeploymentInterfaceType) => {
      onChangeEntity({
        ...entity,
        interfaces: { ...interfaces, [type]: { [baseUrlKey]: '' } },
      });
      setIsSelectingType(false);
    },
    [entity, interfaces, baseUrlKey, onChangeEntity],
  );

  const onAddClick = useCallback(() => {
    if (allowedTypes.length === 1) {
      onAddType(allowedTypes[0]);
    } else {
      setIsSelectingType(true);
    }
  }, [allowedTypes, onAddType]);

  const onChangeField = useCallback(
    (type: string, field: string, value: string) => {
      onChangeEntity({
        ...entity,
        interfaces: { ...interfaces, [type]: { ...interfaces[type], [field]: value } },
      });
    },
    [entity, interfaces, onChangeEntity],
  );

  const onDeleteType = useCallback(
    (type: string) => {
      const updated = { ...interfaces };
      delete updated[type];
      onChangeEntity({ ...entity, interfaces: updated });
    },
    [entity, interfaces, onChangeEntity],
  );

  const showAddButton = availableTypes.length > 0 && !isSelectingType;

  return (
    <div className={classNames('flex flex-col gap-y-2')}>
      <div className="flex items-center gap-x-2">
        <DialLabel label={t(InterfacesI18nKey.Interfaces)} />
        <DialTooltip
          tooltip={
            <div className="flex flex-col gap-1">
              <div>{t(InterfacesI18nKey.InfoBaseUrl)}</div>
            </div>
          }
        >
          <IconInfoCircle {...BASE_BUTTON_ICON_PROPS} className="text-secondary" />
        </DialTooltip>
      </div>

      <div className={classNames('flex flex-col gap-y-2 rounded border border-primary p-4', STANDARD_CONTROL_WIDTH)}>
        {usedTypes.map((type) => (
          <InterfaceRow
            key={type}
            fieldId={`interface-${type}`}
            typeLabel={getInterfaceTypeLabel(t, type)}
            baseUrl={interfaces[type]?.[baseUrlKey] || ''}
            disabled={isReadonly}
            onChangeBaseUrl={(value) => onChangeField(type, baseUrlKey, value)}
            onDelete={() => onDeleteType(type)}
          />
        ))}

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
