import { IconArrowDown, IconArrowUp, IconMinus } from '@tabler/icons-react';
import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

import { GroupedAnalyticsResult, TestCaseThresholdStatus } from '@/src/components/Runs/ExecutionResults/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const ThresholdStatusCellRenderer = ({ value }: ICellRendererParams<GroupedAnalyticsResult>) => {
  const t = useI18n();
  const status = value as TestCaseThresholdStatus | undefined;
  if (status == null) return null;
  const isPass = status === TestCaseThresholdStatus.Pass;
  const isFail = status === TestCaseThresholdStatus.Fail;
  let label = t(RunsI18nKey.NotApplicable);
  let StatusIcon = IconMinus;
  if (isPass) {
    label = t(RunsI18nKey.Above);
    StatusIcon = IconArrowUp;
  } else if (isFail) {
    label = t(RunsI18nKey.Below);
    StatusIcon = IconArrowDown;
  }

  return (
    <span
      className={classNames('inline-flex items-center gap-1', {
        'text-success': isPass,
        'text-error': isFail,
        'text-secondary': !isPass && !isFail,
      })}
    >
      <StatusIcon size={12} aria-hidden />
      {label}
    </span>
  );
};

export default ThresholdStatusCellRenderer;
