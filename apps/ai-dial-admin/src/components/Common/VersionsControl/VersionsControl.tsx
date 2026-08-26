import { FC, useCallback } from 'react';

import { DialSelect, SelectOption, SelectSize, SelectVariant } from '@epam/ai-dial-ui-kit';

import { CompareI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  version: string;
  setVersion: (version: string) => void;
  versions: string[];
}

const VersionsControl: FC<Props> = ({ version, setVersion, versions }) => {
  const t = useI18n();

  const items: SelectOption[] = versions.map((version) => {
    return { value: version, label: version };
  });

  const onChange = useCallback((value: string) => setVersion(value), [setVersion]);

  return (
    <DialSelect
      size={SelectSize.Sm}
      variant={SelectVariant.Secondary}
      options={items}
      value={version}
      onChange={(v) => onChange(v as string)}
      prefix={t(CompareI18nKey.Version)}
    />
  );
};

export default VersionsControl;
