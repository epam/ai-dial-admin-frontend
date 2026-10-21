import { FC, useMemo } from 'react';

import { DialRadioGroup, RadioButtonWithContent, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';

import { SCOPE_LABEL_KEYS } from '@/src/components/Common/ConfigScopeSelector/constants';
import { ExportI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ExportComponentType } from '@/src/types/export';

interface Props {
  /** In display order. Which sources to offer is the page's call, so the import page can withhold one. */
  scopes: ExportComponentType[];
  selectedScope: ExportComponentType;
  onChange: (scope: string) => void;
}

const ConfigScopeSelector: FC<Props> = ({ scopes, selectedScope, onChange }) => {
  const t = useI18n();

  const scopeOptions: RadioButtonWithContent[] = useMemo(
    () => scopes.map((scope) => ({ id: scope, name: t(SCOPE_LABEL_KEYS[scope]) })),
    [scopes, t],
  );

  return (
    <DialRadioGroup
      radioButtons={scopeOptions}
      activeRadioButton={selectedScope}
      elementId="configScope"
      fieldTitle={t(ExportI18nKey.Components)}
      orientation={RadioGroupOrientation.Column}
      onChange={onChange}
    />
  );
};

export default ConfigScopeSelector;
