import { FC, useCallback } from 'react';

import { CompareI18nKey } from '@/src/constants/i18n';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { CompareView } from '@/src/types/activity-audit';
import { useI18n } from '@/src/locales/client';

import Dropdown from '@/src/components/Common/Dropdown/Dropdown';
import DropdownMenuItem from '@/src/components/Common/Dropdown/DropdownItem';

interface Props {
  version: string;
  setVersion: (version: string) => void;
  versions: string[];
}

const VersionsControl: FC<Props> = ({ version, setVersion, versions }) => {
  const t = useI18n();

  const items: DropdownItemsModel[] = versions.map((version) => {
    return { id: version, name: version };
  });

  const onChange = useCallback(
    (value: string) => {
      setVersion(value as CompareView);
    },
    [setVersion],
  );

  return (
    <div className="w-fit">
      <Dropdown
        selectedClassName="flex items-center my-[5px] mr-2 px-1.5 py-1 small text-primary rounded bg-layer-4 cursor-pointer"
        selectedValue={items.find((item) => item.id === version)}
        prefix={`${t(CompareI18nKey.Version)} `}
      >
        {items.map((item, i) => (
          <DropdownMenuItem className="gap-0" key={i} dropdownItem={item} onClick={() => onChange(item.id)} />
        ))}
      </Dropdown>
    </div>
  );
};

export default VersionsControl;
