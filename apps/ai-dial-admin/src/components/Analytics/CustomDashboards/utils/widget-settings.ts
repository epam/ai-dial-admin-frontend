import { isEmpty, omit } from 'lodash';

import { WidgetSettings } from '@/src/components/Analytics/CustomDashboards/models';
import { DEFAULT_CURRENCY } from '@/src/constants/analytics/dashboards';
import { DashboardWidgetSettings, WidgetValueFormat, WidgetView } from '@/src/models/analytics/dashboard';

export const toStoredWidgetSettings = (
  stored: DashboardWidgetSettings | undefined,
  { view, valueFormat, currency }: WidgetSettings,
): DashboardWidgetSettings | undefined => {
  const isFormatted = view === WidgetView.SingleValue || view === WidgetView.Share;
  const isMoney = isFormatted && valueFormat === WidgetValueFormat.Money;
  const settings: DashboardWidgetSettings = {
    ...omit(stored, ['value_format', 'currency']),
    ...(isFormatted && valueFormat !== WidgetValueFormat.Number ? { value_format: valueFormat } : {}),
    ...(isMoney && currency !== DEFAULT_CURRENCY ? { currency } : {}),
  };
  return isEmpty(settings) ? undefined : settings;
};
