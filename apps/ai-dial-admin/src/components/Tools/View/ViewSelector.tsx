import { CompareI18nKey, EntitiesI18nKey, TypeI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ParamsView } from '@/src/types/parameters';
import { DialSelect, SelectOption, SelectSize, SelectVariant } from '@epam/ai-dial-ui-kit';
import { FC, useMemo } from 'react';

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
    <DialSelect
      prefix={`${t(CompareI18nKey.View)}: `}
      size={SelectSize.Sm}
      variant={SelectVariant.Secondary}
      options={items}
      value={view}
      onChange={(v) => changeView(v as ParamsView)}
    />
  );
};

export default ViewSelector;
