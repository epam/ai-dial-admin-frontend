import { IconSearch } from '@tabler/icons-react';
import { FC, useEffect, useState } from 'react';

import InputWithIcon from '@/src/components/Common/Input/InputWithIcon';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  initialPattern?: string;
  onChange: (value: string) => void;
}

const Search: FC<Props> = ({ initialPattern, onChange }) => {
  const t = useI18n();
  const [pattern, setPattern] = useState<string>(initialPattern || '');

  useEffect(() => {
    setPattern(initialPattern || '');
  }, [initialPattern]);

  return (
    <InputWithIcon
      inputId="search"
      placeholder={t(BasicI18nKey.Search)}
      iconBeforeInput={<IconSearch {...BASE_ICON_PROPS} />}
      value={pattern}
      onChange={(value) => {
        setPattern(value);
        onChange(value);
      }}
    />
  );
};

export default Search;
