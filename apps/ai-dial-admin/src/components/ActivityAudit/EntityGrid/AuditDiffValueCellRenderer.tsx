import { FC, useMemo } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import InlineTextDiff from '@/src/components/ActivityAudit/EntityGrid/InlineTextDiff';
import { formatAuditDiffValue } from '@/src/components/ActivityAudit/EntityGrid/constants';
import { ActivityAuditDiff } from '@/src/models/activity-audit';
import { ActivityAuditResourceType, DiffStatus } from '@/src/types/activity-audit';
import { buildInlineTextDiff } from '@/src/utils/diff/inline-text-diff';
import { InlineTextDiffSide } from '@/src/utils/diff/models';

interface RendererParams extends ICellRendererParams<ActivityAuditDiff> {
  diffSide?: InlineTextDiffSide;
  parameter?: string;
  resourceType?: ActivityAuditResourceType;
  t?: (key: string, params?: Record<string, string>) => string;
}

const AuditDiffValueCellRenderer: FC<RendererParams> = (params) => {
  const { data, diffSide, parameter, resourceType, t } = params;
  const displayValue = params.valueFormatted ?? params.value ?? '';

  const segments = useMemo(() => {
    if (!data || data.diffStatus !== DiffStatus.CHANGED || data.pairedValue == null || !diffSide || !t) {
      return null;
    }

    const beforeRaw = diffSide === InlineTextDiffSide.Before ? data.value : data.pairedValue;
    const afterRaw = diffSide === InlineTextDiffSide.Before ? data.pairedValue : data.value;
    const beforeText = formatAuditDiffValue(parameter, beforeRaw, t, resourceType);
    const afterText = formatAuditDiffValue(parameter, afterRaw, t, resourceType);

    return buildInlineTextDiff(beforeText, afterText, diffSide);
  }, [data, diffSide, parameter, resourceType, t]);

  if (segments) {
    return <InlineTextDiff segments={segments} />;
  }

  return <span className="whitespace-pre-wrap break-words">{displayValue}</span>;
};

export default AuditDiffValueCellRenderer;
