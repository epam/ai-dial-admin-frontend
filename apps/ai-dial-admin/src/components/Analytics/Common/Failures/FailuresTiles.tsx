import { FC } from 'react';

import { Button, ButtonAppearance, ButtonVariant, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconRefresh } from '@tabler/icons-react';

import { FailuresActionTile, FailuresPassiveTile } from '@/src/components/Analytics/Common/Failures/models';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  action: FailuresActionTile;
  passive: FailuresPassiveTile;
}

const FailuresTiles: FC<Props> = ({ action, passive }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div className="flex flex-row flex-wrap items-center justify-between gap-3 rounded border border-secondary p-3">
      <div className="flex flex-col gap-1">
        <span className="dial-small-semi-text text-primary">{action.label}</span>
        <span className="dial-tiny-text text-secondary">{action.hint}</span>
      </div>
      {action.canRetryAll && action.onRetryAll && (
        <Button
          variant={ButtonVariant.Neutral}
          appearance={ButtonAppearance.Outlined}
          size={ElementSize.Small}
          label={action.retryAllLabel}
          iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
          disabled={action.isBusy}
          onClick={action.onRetryAll}
        />
      )}
    </div>

    <div className="flex flex-col gap-1 rounded border border-secondary p-3">
      <span className="dial-small-semi-text text-primary">{passive.label}</span>
      <span className="dial-tiny-text text-secondary">{passive.hint}</span>
    </div>
  </div>
);

export default FailuresTiles;
