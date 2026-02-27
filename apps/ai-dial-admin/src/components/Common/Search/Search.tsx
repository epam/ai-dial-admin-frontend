import { DialSearch } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  initialPattern?: string;
  onChange: (value: string) => void;
}

const Search: FC<Props> = ({ initialPattern, onChange }) => {
  const t = useI18n();

  return <DialSearch id="search" placeholder={t(BasicI18nKey.Search)} value={initialPattern} onChange={onChange} />;
};

export default Search;
