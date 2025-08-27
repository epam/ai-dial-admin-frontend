import { Dispatch, FC, SetStateAction, useCallback } from 'react';

import Dropdown from '@/src/components/Common/Dropdown/Dropdown';
import DropdownMenuItem from '@/src/components/Common/Dropdown/DropdownItem';
import { ActivityAuditI18nKey, CompareI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { CompareView } from '@/src/types/activity-audit';

interface Props {
  compareView: string;
  setCompareView: Dispatch<SetStateAction<CompareView>>;
}

const CompareControl: FC<Props> = ({ compareView, setCompareView }) => {
  const t = useI18n();

  const items: DropdownItemsModel[] = [
    {
      id: CompareView.NEXT,
      name: t(ActivityAuditI18nKey.BeforeAfter),
    },
    {
      id: CompareView.CURRENT,
      name: t(ActivityAuditI18nKey.BeforeCurrent),
    },
  ];

  const onChange = useCallback(
    (value: string) => {
      setCompareView(value as CompareView);
    },
    [setCompareView],
  );

  return (
    <div className="w-fit">
      <Dropdown
        selectedClassName="flex items-center my-[5px] mr-2 px-1.5 py-1 small text-primary rounded bg-layer-4 cursor-pointer"
        selectedValue={items.find((item) => item.id === compareView)}
        prefix={`${t(CompareI18nKey.Comparison)}: `}
      >
        {items.map((item, i) => (
          <DropdownMenuItem className="gap-0" key={i} dropdownItem={item} onClick={() => onChange(item.id)} />
        ))}
      </Dropdown>
    </div>
  );
};

export default CompareControl;
