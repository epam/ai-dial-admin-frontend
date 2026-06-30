import { DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC, ReactNode } from 'react';

import { MetricStatus } from '@/src/components/Common/MetricCard/models';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  title: string;
  loading: boolean;
  isEmpty: boolean;
  // Human-readable availability reason shown instead of a bare "No Data".
  emptyReason?: string;
  // Drives the status accent (left border). Neutral/Ok render no alarm color.
  status?: MetricStatus;
  children: ReactNode;
}

// Colored 4px left accent only for a real status; neutral/no-data keep the plain border (telemetry default).
const STATUS_BORDER: Partial<Record<MetricStatus, string>> = {
  [MetricStatus.Ok]: 'border-l-4 border-l-success',
  [MetricStatus.Warn]: 'border-l-4 border-l-warning',
  [MetricStatus.Crit]: 'border-l-4 border-l-error',
};

const MetricCardShell: FC<Props> = ({
  title,
  loading,
  isEmpty,
  emptyReason,
  status = MetricStatus.Neutral,
  children,
}) => {
  const t = useI18n();

  return (
    <div
      className={classNames(
        'flex flex-col rounded-lg border border-primary md:min-w-[250px] min-w-[120px] w-full p-4 flex-1 min-h-0',
        STATUS_BORDER[status],
      )}
    >
      <h3 className="text-primary mb-4">{t(title)}</h3>
      {loading ? (
        <DialLoader size={24} />
      ) : isEmpty ? (
        <DialNoDataContent title={emptyReason || t(BasicI18nKey.NoData)} />
      ) : (
        <div className="flex flex-1 items-center justify-center min-h-0">{children}</div>
      )}
    </div>
  );
};

export default MetricCardShell;
