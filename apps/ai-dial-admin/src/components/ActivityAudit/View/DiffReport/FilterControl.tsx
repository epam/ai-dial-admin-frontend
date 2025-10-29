import { Dispatch, FC, SetStateAction, useCallback } from 'react';
import { DropdownItem } from '@epam/ai-dial-ui-kit';

import { ActivityAuditI18nKey, CompareI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DiffView } from '@/src/types/activity-audit';
import SecondaryDropdown from '@/src/components/Common/SecondaryDropdown/SecondaryDropdown';

interface Props {
  diffView: string;
  setDiffView: Dispatch<SetStateAction<DiffView>>;
  isResources?: boolean;
}

const FilterControl: FC<Props> = ({ diffView, setDiffView, isResources }) => {
  const t = useI18n();

  const items: DropdownItem[] = [
    {
      key: DiffView.ALL,
      label: isResources ? t(ActivityAuditI18nKey.AllResources) : t(ActivityAuditI18nKey.AllParameters),
    },
    {
      key: DiffView.DIFF,
      label: t(ActivityAuditI18nKey.Differences),
    },
  ];

  const onChange = useCallback(
    (value: string) => {
      setDiffView(value as DiffView);
    },
    [setDiffView],
  );

  return (
    <SecondaryDropdown
      items={items}
      selectedValue={diffView}
      prefix={`${t(CompareI18nKey.View)}: `}
      onChange={onChange}
    />
  );
};

export default FilterControl;
