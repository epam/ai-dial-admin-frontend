import { Dispatch, FC, SetStateAction, useCallback } from 'react';

import Dropdown from '@/src/components/Common/Dropdown/Dropdown';
import DropdownMenuItem from '@/src/components/Common/Dropdown/DropdownItem';
import { ActivityAuditI18nKey, BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { DiffView } from '@/src/types/activity-audit';

interface Props {
  diffView: string;
  setDiffView: Dispatch<SetStateAction<DiffView>>;
  isResources?: boolean;
}

const FilterControl: FC<Props> = ({ diffView, setDiffView, isResources }) => {
  const t = useI18n();

  const items: DropdownItemsModel[] = [
    {
      id: DiffView.ALL,
      name: isResources ? t(ActivityAuditI18nKey.AllResources) : t(ActivityAuditI18nKey.AllParameters),
    },
    {
      id: DiffView.DIFF,
      name: t(ActivityAuditI18nKey.Differences),
    },
  ];

  const onChange = useCallback(
    (value: string) => {
      setDiffView(value as DiffView);
    },
    [setDiffView],
  );

  return (
    <div className="w-fit">
      <Dropdown
        selectedClassName="flex items-center my-[5px] mr-2 px-1.5 py-1 small text-primary rounded bg-layer-4 cursor-pointer"
        selectedValue={items.find((item) => item.id === diffView)}
        prefix={`${t(BasicI18nKey.View)}: `}
      >
        {items.map((item, i) => (
          <DropdownMenuItem className="gap-0" key={i} dropdownItem={item} onClick={() => onChange(item.id)} />
        ))}
      </Dropdown>
    </div>
  );
};

export default FilterControl;
