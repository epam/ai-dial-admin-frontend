import { SelectOption } from '@epam/ai-dial-ui-kit';
import { Dispatch, FC, SetStateAction, useCallback } from 'react';

import SecondaryDropdown from '@/src/components/Common/SecondaryDropdown/SecondaryDropdown';
import { ActivityAuditI18nKey, CompareI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { CompareView } from '@/src/types/activity-audit';

interface Props {
  compareView: string;
  setCompareView: Dispatch<SetStateAction<CompareView>>;
}

const CompareControl: FC<Props> = ({ compareView, setCompareView }) => {
  const t = useI18n();

  const items: SelectOption[] = [
    {
      value: CompareView.NEXT,
      label: t(ActivityAuditI18nKey.BeforeAfter),
    },
    {
      value: CompareView.CURRENT,
      label: t(ActivityAuditI18nKey.BeforeCurrent),
    },
  ];

  const onChange = useCallback(
    (value: string) => {
      setCompareView(value as CompareView);
    },
    [setCompareView],
  );

  return (
    <SecondaryDropdown
      items={items}
      selectedValue={compareView}
      prefix={`${t(CompareI18nKey.Comparison)}: `}
      onChange={onChange}
    />
  );
};

export default CompareControl;
