import { FC } from 'react';

import { Button, ButtonAppearance, ButtonVariant, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconRefresh } from '@tabler/icons-react';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  message: string;
  retryLabel: string;
  onRetry: () => void;
}

/**
 * The read failed. Never the empty state: on a failure listing the two are opposite conclusions and the
 * quiet one is the dangerous one.
 */
const FailuresReadFailed: FC<Props> = ({ message, retryLabel, onRetry }) => (
  <div className="flex flex-row flex-wrap items-center gap-3" role="status">
    <span className="dial-small-text text-error">{message}</span>
    <Button
      variant={ButtonVariant.Neutral}
      appearance={ButtonAppearance.Outlined}
      size={ElementSize.Small}
      label={retryLabel}
      iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
      onClick={onRetry}
    />
  </div>
);

export default FailuresReadFailed;
