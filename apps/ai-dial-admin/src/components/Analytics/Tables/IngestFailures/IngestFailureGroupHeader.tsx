'use client';

import { FC } from 'react';

import { Button, ButtonVariant, Checkbox, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconRefresh } from '@tabler/icons-react';

import { IngestFailureGroup } from '@/src/components/Analytics/Tables/IngestFailures/models';
import {
  isDeterministicReason,
  kindLabelKey,
  reasonDescriptionKey,
  reasonLabelKey,
} from '@/src/components/Analytics/Tables/IngestFailures/utils';
import { IngestFailuresI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  group: IngestFailureGroup;
  selectedCount: number;
  isBusy: boolean;
  onSelectGroup: (group: IngestFailureGroup, isSelected: boolean) => void;
  onRetryGroup: (group: IngestFailureGroup) => void;
}

const IngestFailureGroupHeader: FC<Props> = ({ group, selectedCount, isBusy, onSelectGroup, onRetryGroup }) => {
  const t = useI18n();

  const labelKey = reasonLabelKey(group.reason);
  const descriptionKey = reasonDescriptionKey(group.reason);
  const reason = labelKey ? t(labelKey) : group.reason;
  const kindKey = kindLabelKey(group.kind);
  const kind = kindKey ? t(kindKey) : group.kind;
  const total = group.failures.length;
  const isDeterministic = isDeterministicReason(group.reason, group.failures[0]?.failure_class);

  return (
    <div
      role="group"
      aria-label={`${reason}, ${kind}`}
      className="flex flex-row items-start gap-3 bg-layer-3 px-3 py-3"
    >
      <Checkbox
        aria-label={t(IngestFailuresI18nKey.SelectGroup, { reason, kind })}
        isSelected={selectedCount === total}
        isIndeterminate={selectedCount > 0 && selectedCount < total}
        disabled={isBusy}
        onChange={() => onSelectGroup(group, selectedCount < total)}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-row flex-wrap items-baseline gap-x-2">
          <span className="dial-small-semi-text text-primary">{reason}</span>
          <span className="dial-tiny-text text-secondary">{kind}</span>
          <span className="dial-tiny-text text-secondary">{t(IngestFailuresI18nKey.GroupCount, { count: total })}</span>
        </div>
        {descriptionKey && <span className="dial-tiny-text text-secondary">{t(descriptionKey)}</span>}
        {isDeterministic && (
          <span className="dial-tiny-text text-primary">{t(IngestFailuresI18nKey.DeterministicCaveat)}</span>
        )}
      </div>
      <Button
        variant={ButtonVariant.Neutral}
        size={ElementSize.Small}
        label={t(IngestFailuresI18nKey.RetryAll)}
        iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
        disabled={isBusy}
        onClick={() => onRetryGroup(group)}
      />
    </div>
  );
};

export default IngestFailureGroupHeader;
