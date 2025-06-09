import { FC } from 'react';

import Dropdown from '@/src/components/Common/Dropdown/Dropdown';
import DropdownMenuItem from '@/src/components/Common/Dropdown/DropdownItem';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { refreshOptionsConfig } from '@/src/constants/telemetry';
import { useI18n } from '@/src/locales/client';

interface Props {
  selectedValue: string;
  onChange: (value: string) => void;
}

const Refresh: FC<Props> = ({ selectedValue, onChange }) => {
  const t = useI18n();

  return (
    <Dropdown
      selectedValue={refreshOptionsConfig.find((item) => item.id === selectedValue)}
      prefix={t(TelemetryI18nKey.AutoRefresh)}
    >
      {refreshOptionsConfig.map((item, i) => (
        <DropdownMenuItem key={i} dropdownItem={item} onClick={() => onChange(item.id)} />
      ))}
    </Dropdown>
  );
};

export default Refresh;
