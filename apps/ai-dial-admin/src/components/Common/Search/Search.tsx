import { Search } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  initialPattern?: string;
  onChange: (value: string) => void;
}

const SearchField: FC<Props> = ({ initialPattern, onChange }) => {
  const t = useI18n();

  return (
    <Search
      id="search"
      placeholder={t(BasicI18nKey.Search)}
      value={initialPattern}
      onChange={(value) => onChange(value ?? '')}
    />
  );
};

export default SearchField;
