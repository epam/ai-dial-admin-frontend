import { Dispatch, FC, SetStateAction, useCallback } from 'react';
import { DialSelect, SelectVariant, SelectOption, SelectSize } from '@epam/ai-dial-ui-kit';

import { ActivityAuditI18nKey, CompareI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DiffView } from '@/src/types/activity-audit';

interface Props {
  diffView: string;
  setDiffView: Dispatch<SetStateAction<DiffView>>;
  isResources?: boolean;
}

const FilterControl: FC<Props> = ({ diffView, setDiffView, isResources }) => {
  const t = useI18n();

  const items: SelectOption[] = [
    {
      value: DiffView.ALL,
      label: isResources ? t(ActivityAuditI18nKey.AllResources) : t(ActivityAuditI18nKey.AllParameters),
    },
    {
      value: DiffView.DIFF,
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
    <DialSelect
      size={SelectSize.Sm}
      variant={SelectVariant.Secondary}
      options={items}
      value={diffView}
      prefix={`${t(CompareI18nKey.View)}: `}
      onChange={(v) => onChange(v as string)}
    />
  );
};

export default FilterControl;
