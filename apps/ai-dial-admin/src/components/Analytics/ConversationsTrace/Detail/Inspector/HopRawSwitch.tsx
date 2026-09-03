'use client';

import { ElementSize, GhostButton } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC } from 'react';

import {
  FILTER_CHIP_CLASS,
  NEUTRAL_CHIP_CLASS,
  SELECTED_CHIP_CLASS,
} from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  isRaw: boolean;
  onChange: (isRaw: boolean) => void;
}

// A chip rather than a toggle switch: a switch widget at the end of a line of facts read as a setting for the
// screen, and its accessible node was not the thing a pointer could reach.
const HopRawSwitch: FC<Props> = ({ isRaw, onChange }) => {
  const t = useI18n();

  return (
    <GhostButton
      size={ElementSize.Small}
      aria-pressed={isRaw}
      label={t(ConversationsTraceI18nKey.InspectorRaw)}
      onClick={() => onChange(!isRaw)}
      className={classNames('ml-auto shrink-0', FILTER_CHIP_CLASS, isRaw ? SELECTED_CHIP_CLASS : NEUTRAL_CHIP_CLASS)}
      textClassName="dial-caption-text"
    />
  );
};

export default HopRawSwitch;
