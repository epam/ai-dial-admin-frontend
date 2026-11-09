'use client';

import { FC } from 'react';

import { Button, ButtonAppearance, ButtonVariant, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconRefresh } from '@tabler/icons-react';

import { IngestFailuresI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  count: number;
  isBusy: boolean;
  onClear: () => void;
  onRetry: () => void;
}

const IngestFailuresSelectionBar: FC<Props> = ({ count, isBusy, onClear, onRetry }) => {
  const t = useI18n();

  return (
    <div className="flex flex-row flex-wrap items-center gap-3 rounded bg-layer-3 px-3 py-2">
      <span className="dial-small-semi-text text-primary" role="status" aria-live="polite">
        {t(IngestFailuresI18nKey.Selected, { count })}
      </span>
      <Button
        variant={ButtonVariant.Neutral}
        appearance={ButtonAppearance.Outlined}
        size={ElementSize.Small}
        className="ml-auto"
        label={t(IngestFailuresI18nKey.ClearSelection)}
        disabled={isBusy}
        onClick={onClear}
      />
      <Button
        variant={ButtonVariant.Primary}
        size={ElementSize.Small}
        label={t(IngestFailuresI18nKey.RetrySelected)}
        iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
        disabled={isBusy}
        onClick={onRetry}
      />
    </div>
  );
};

export default IngestFailuresSelectionBar;
