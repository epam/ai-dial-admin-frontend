'use client';

import { FC } from 'react';

import SpanGroupPanel from '@/src/components/Analytics/SessionsTrace/Detail/SpanGroupPanel';
import { useSpanFieldGroups } from '@/src/components/Analytics/SessionsTrace/Detail/use-span-field-groups';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SpanFieldGroup } from '@/src/models/analytics/sessions-trace';

interface Props {
  groups: SpanFieldGroup[];
  // Any record the groups describe: a span's row, or a session's.
  row: Record<string, unknown>;
  // Whether the rows state a rollup record rather than a hop: its zeros are sums, so a reported zero is a value,
  // and each value offers to be copied.
  isRecord?: boolean;
  // The column each group previews while closed, by tag. Absent uses the hop log's.
  summaryFields?: Record<string, string>;
}

// No groups means the schema read failed, not that the span recorded nothing: the facts above this section
// are read from the typed span row and need no schema.
const SpanFieldsSection: FC<Props> = ({ groups, row, isRecord, summaryFields }) => {
  const t = useI18n();
  const { openTag, onToggleGroup } = useSpanFieldGroups({ groups });

  return (
    <section className="flex min-h-0 flex-col">
      {groups.length === 0 ? (
        <p className="text-secondary dial-tiny-text">{t(SessionsTraceI18nKey.SpanFieldsUnavailable)}</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded border border-primary bg-layer-3 p-1">
          {groups.map((group) => (
            <SpanGroupPanel
              key={group.tag}
              group={group}
              row={row}
              isRecord={isRecord}
              summaryFields={summaryFields}
              isOpen={openTag === group.tag}
              onToggle={onToggleGroup}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default SpanFieldsSection;
