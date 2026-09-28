'use client';

import { DialSelectField } from '@epam/ai-dial-ui-kit';

import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import { getInterfaceTypeLabel } from '@/src/components/BaseControls/InterfacesField/InterfacesField';
import { MODEL_INTERFACE_TYPES } from '@/src/constants/deployment-interfaces';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, InterfacesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DeploymentInterfaceType, TranslatorReference } from '@/src/models/dial/interfaces';
import type { ResourceInfo } from '@/src/server/core/asset-metadata';

const CUSTOM_VALUE = '__custom__';

interface Props {
  fieldId: string;
  // The interface type this translator reference is attached to — Core's implicit `in`. Excluded from
  // the `out` options: a translator can't translate an interface into itself.
  type: DeploymentInterfaceType;
  translator?: TranslatorReference;
  translators: ResourceInfo[];
  disabled?: boolean;
  onChange: (translator: TranslatorReference) => void;
}

// Peer of InterfaceRow's base_url input for InterfaceMode.Translator: a named reference to a platform
// Translator asset, or — via `Custom` — an inline `{ base_url, out }` matching Core's TranslatorRef.
// No `in` control: it's implicit from the interface type this reference is attached to.
const TranslatorField = ({ fieldId, type, translator, translators, disabled, onChange }: Props) => {
  const t = useI18n();
  const isCustom = typeof translator === 'object' && translator != null;
  const selectedValue = isCustom ? CUSTOM_VALUE : (translator ?? '');
  const outTypeOptions = MODEL_INTERFACE_TYPES.filter((interfaceType) => interfaceType !== type);

  const options = [
    ...translators.map((tr) => ({ value: tr.name, label: tr.name })),
    { value: CUSTOM_VALUE, label: t(InterfacesI18nKey.Custom) },
  ];

  const onChangeSelect = (value: string) => {
    if (value === CUSTOM_VALUE) {
      onChange({ baseUrl: '', out: outTypeOptions[0] });
      return;
    }
    onChange(value);
  };

  return (
    <div className="flex flex-col gap-y-2 w-full">
      <DialSelectField
        id={`${fieldId}-translator`}
        label={t(InterfacesI18nKey.Translator)}
        placeholder={t(InterfacesI18nKey.SelectTranslator)}
        options={options}
        value={selectedValue}
        disabled={disabled}
        onChange={(value) => onChangeSelect(value as string)}
      />
      {isCustom && (
        <div className="flex items-start gap-x-2 w-full">
          <EndpointControl
            id={`${fieldId}-translator-base-url`}
            label={t(EntityFieldsI18nKey.baseUrl)}
            placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
            isFullWidth
            disabled={disabled}
            endpoint={translator.baseUrl}
            onChange={(baseUrl) => onChange({ ...translator, baseUrl: baseUrl ?? '' })}
          />
          <DialSelectField
            id={`${fieldId}-translator-out`}
            label={t(EntityFieldsI18nKey.translatorOut)}
            options={outTypeOptions.map((outType) => ({ value: outType, label: getInterfaceTypeLabel(t, outType) }))}
            value={translator.out}
            disabled={disabled}
            onChange={(value) => onChange({ ...translator, out: value as DeploymentInterfaceType })}
          />
        </div>
      )}
    </div>
  );
};

export default TranslatorField;
