import { FC, useCallback } from 'react';

import { DropdownItem } from '@epam/ai-dial-ui-kit';

import { CompareI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { CompareView } from '@/src/types/activity-audit';
import SecondaryDropdown from '@/src/components/Common/SecondaryDropdown/SecondaryDropdown';

interface Props {
  version: string;
  setVersion: (version: string) => void;
  versions: string[];
}

const VersionsControl: FC<Props> = ({ version, setVersion, versions }) => {
  const t = useI18n();

  const items: DropdownItem[] = versions.map((version) => {
    return { key: version, label: version };
  });

  const onChange = useCallback(
    (value: string) => {
      setVersion(value as CompareView);
    },
    [setVersion],
  );

  return (
    <SecondaryDropdown prefix={t(CompareI18nKey.Version)} items={items} selectedValue={version} onChange={onChange} />
  );
};

export default VersionsControl;
