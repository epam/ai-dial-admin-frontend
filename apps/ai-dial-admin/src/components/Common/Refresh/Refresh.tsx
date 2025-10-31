import { DialSelect } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

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
    <DialSelect
      prefix={t(TelemetryI18nKey.AutoRefresh)}
      options={refreshOptionsConfig}
      value={selectedValue}
      onChange={(value) => onChange(value as string)}
    />
  );
};

export default Refresh;
