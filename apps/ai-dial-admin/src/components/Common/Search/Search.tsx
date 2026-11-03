import { Search } from '@epam/ai-dial-ui-kit';
import { FC, useId } from 'react';

import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const SearchField: FC<Props> = ({ value, onChange }) => {
  const t = useI18n();
  const id = useId();

  return (
    <Search id={id} placeholder={t(BasicI18nKey.Search)} value={value} onChange={(value) => onChange(value ?? '')} />
  );
};

export default SearchField;
