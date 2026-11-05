'use client';

import { FC, useId, useMemo, useState } from 'react';

import { Button, ButtonAppearance, ButtonVariant, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

import IngestFailuresGrid from '@/src/components/Analytics/Tables/IngestFailures/IngestFailuresGrid';
import { groupIngestFailures } from '@/src/components/Analytics/Tables/IngestFailures/utils';
import { IngestFailuresI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { IngestFailure } from '@/src/models/analytics/ingest-failure';

interface Props {
  failures: IngestFailure[];
  count: number;
  now: number;
}

const NO_SELECTION = new Set<string>();
const noop = () => {};

const IngestFailuresPendingList: FC<Props> = ({ failures, count, now }) => {
  const t = useI18n();
  const gridId = useId();
  const [isExpanded, setIsExpanded] = useState(false);

  const groups = useMemo(() => groupIngestFailures(failures), [failures]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row flex-wrap items-center justify-between gap-3">
        <span className="dial-small-semi-text text-primary">
          {t(IngestFailuresI18nKey.RetryingAutomatically, { count })}
        </span>
        {failures.length > 0 && (
          <Button
            variant={ButtonVariant.Neutral}
            appearance={ButtonAppearance.Outlined}
            size={ElementSize.Small}
            label={t(isExpanded ? IngestFailuresI18nKey.HidePending : IngestFailuresI18nKey.ShowPending)}
            iconBefore={
              isExpanded ? (
                <IconChevronDown {...BASE_BUTTON_ICON_PROPS} aria-hidden />
              ) : (
                <IconChevronRight {...BASE_BUTTON_ICON_PROPS} aria-hidden />
              )
            }
            aria-expanded={isExpanded}
            aria-controls={gridId}
            onClick={() => setIsExpanded((prev) => !prev)}
          />
        )}
      </div>
      <div id={gridId}>
        {isExpanded && (
          <IngestFailuresGrid
            groups={groups}
            isPending
            selected={NO_SELECTION}
            isBusy={false}
            now={now}
            onToggleSelect={noop}
            onSelectGroup={noop}
            onRetryOne={noop}
            onRetryGroup={noop}
          />
        )}
      </div>
    </div>
  );
};

export default IngestFailuresPendingList;
