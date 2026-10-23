import { FC, useMemo } from 'react';

import { Select, SelectOption, ElementSize } from '@epam/ai-dial-ui-kit';

import { CompareI18nKey, EntitiesI18nKey, TypeI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ParamsView } from '@/src/types/parameters';

interface Props {
  view: string;
  changeView: (v: ParamsView) => void;
}

const ViewSelector: FC<Props> = ({ view, changeView }) => {
  const t = useI18n();
  const items: SelectOption[] = useMemo(() => {
    return [
      {
        value: ParamsView.TABLE,
        label: t(EntitiesI18nKey[ParamsView.TABLE]),
      },
      {
        value: ParamsView.JSON,
        label: t(TypeI18nKey[ParamsView.JSON]),
      },
    ];
  }, [t]);
  return (
    <Select
      prefix={`${t(CompareI18nKey.View)}: `}
      ariaLabel={t(CompareI18nKey.View)}
      size={ElementSize.Small}
      options={items}
      value={view}
      onChange={(v) => changeView(v as ParamsView)}
    />
  );
};

export default ViewSelector;
