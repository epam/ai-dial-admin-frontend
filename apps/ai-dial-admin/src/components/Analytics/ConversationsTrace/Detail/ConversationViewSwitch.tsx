'use client';

import { DialSegmentedControl, SegmentedControlOption } from '@epam/ai-dial-ui-kit';
import { FC, useMemo } from 'react';

import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationDetailView } from '@/src/models/analytics/conversations-trace';

interface Props {
  view: ConversationDetailView;
  isChatDisabled: boolean;
  disabledReason?: string;
  onSelectView: (view: ConversationDetailView) => void;
}

const ConversationViewSwitch: FC<Props> = ({ view, isChatDisabled, disabledReason, onSelectView }) => {
  const t = useI18n();

  const options: SegmentedControlOption<ConversationDetailView>[] = useMemo(
    () => [
      {
        value: ConversationDetailView.Chat,
        label: t(ConversationsTraceI18nKey.ViewChat),
        disabled: isChatDisabled,
      },
      { value: ConversationDetailView.Trace, label: t(ConversationsTraceI18nKey.ViewTrace) },
    ],
    [isChatDisabled, t],
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <DialSegmentedControl
        ariaLabel={t(ConversationsTraceI18nKey.ViewSwitchLabel)}
        options={options}
        value={view}
        onChange={onSelectView}
      />
      {isChatDisabled && disabledReason && <p className="dial-tiny-text text-secondary">{disabledReason}</p>}
    </div>
  );
};

export default ConversationViewSwitch;
