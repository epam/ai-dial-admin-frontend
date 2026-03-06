import { FC, useMemo } from 'react';

import { DialRadioGroup, RadioButtonWithContent, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';

import { ExportI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ExportComponentType } from '@/src/types/export';

interface Props {
  selectedScope: ExportComponentType;
  onChange: (scope: string) => void;
}

const ConfigScopeSelector: FC<Props> = ({ selectedScope, onChange }) => {
  const t = useI18n();

  const scopeOptions: RadioButtonWithContent[] = useMemo(
    () => [
      {
        id: ExportComponentType.ADMIN,
        name: t(ExportI18nKey.EntitiesBuildersAccess),
      },
      {
        id: ExportComponentType.DEPLOYMENTS,
        name: t(ExportI18nKey.Deployments),
      },
    ],
    [t],
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
