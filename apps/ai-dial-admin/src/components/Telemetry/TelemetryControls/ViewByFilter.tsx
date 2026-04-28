import { DialSelect, SelectSize, SelectVariant } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { TelemetryI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DASHBOARD_VIEW_TYPE } from '@/src/types/telemetry';

const viewByOptions = [
  { value: DASHBOARD_VIEW_TYPE.Chat, label: TelemetryI18nKey.ViewByChat },
  { value: DASHBOARD_VIEW_TYPE.Mcp, label: TelemetryI18nKey.ViewByMcp },
  { value: DASHBOARD_VIEW_TYPE.Route, label: TelemetryI18nKey.ViewByRoute },
];

interface Props {
  value: DASHBOARD_VIEW_TYPE;
  onChange: (value: DASHBOARD_VIEW_TYPE) => void;
}

const ViewByFilter: FC<Props> = ({ value, onChange }) => {
  const t = useI18n();

  const translatedOptions = viewByOptions.map((option) => ({
    ...option,
    label: t(option.label),
  }));

  return (
    <DialSelect
      size={SelectSize.Sm}
      variant={SelectVariant.Secondary}
      prefix={t(TelemetryI18nKey.ViewByLabel)}
      options={translatedOptions}
      value={value}
      onChange={(val) => onChange(val as DASHBOARD_VIEW_TYPE)}
    />
  );
};

export default ViewByFilter;
