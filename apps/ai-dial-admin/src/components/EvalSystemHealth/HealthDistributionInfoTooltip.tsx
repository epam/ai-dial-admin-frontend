'use client';

import { FC } from 'react';

import { DIAL_ICON_SIZE, ElementSize, GhostIconButton, Tooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';

import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  threshold: number;
}

/** A focusable info control: the tooltip opens on keyboard focus as well as on hover. */
const HealthDistributionInfoTooltip: FC<Props> = ({ threshold }) => {
  const t = useI18n();

  return (
    <Tooltip tooltip={t(EvalSystemHealthI18nKey.HealthDistributionInfoTooltip, { threshold })} asChild>
      <GhostIconButton
        size={ElementSize.Small}
        icon={<IconInfoCircle size={DIAL_ICON_SIZE.SM} aria-hidden />}
        aria-label={t(EvalSystemHealthI18nKey.HealthDistributionInfoLabel)}
      />
    </Tooltip>
  );
};

export default HealthDistributionInfoTooltip;
