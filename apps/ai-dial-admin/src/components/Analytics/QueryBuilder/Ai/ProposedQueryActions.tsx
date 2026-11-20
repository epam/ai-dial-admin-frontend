'use client';

import { FC } from 'react';

import { Badge, Button, ButtonVariant, ElementSize, PrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconX } from '@tabler/icons-react';

import { ProposedQueryStatus } from '@/src/components/Analytics/QueryBuilder/Ai/models';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  status: ProposedQueryStatus;
  isApplyDisabled: boolean;
  onApply: () => void;
  onDismiss: () => void;
}

const ProposedQueryActions: FC<Props> = ({ status, isApplyDisabled, onApply, onDismiss }) => {
  const t = useI18n();

  if (status === ProposedQueryStatus.Dismissed) {
    return (
      <div className="flex flex-col items-start gap-2">
        <Badge icon={<IconX size={12} aria-hidden />} label={t(QueryBuilderI18nKey.ProposedQueryDismissed)} />
        <p className="dial-small-text text-primary">{t(QueryBuilderI18nKey.ProposedQueryDismissedNote)}</p>
      </div>
    );
  }

  const isApplied = status === ProposedQueryStatus.Applied;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end gap-2">
        {!isApplied && (
          <Button
            variant={ButtonVariant.Neutral}
            size={ElementSize.Small}
            label={t(QueryBuilderI18nKey.ProposedQueryDismiss)}
            onClick={onDismiss}
          />
        )}
        <PrimaryButton
          size={ElementSize.Small}
          label={t(QueryBuilderI18nKey.ProposedQueryApply)}
          onClick={onApply}
          disabled={isApplyDisabled}
        />
      </div>
      {isApplied && <p className="dial-small-text text-primary">{t(QueryBuilderI18nKey.ProposedQueryAppliedNote)}</p>}
    </div>
  );
};

export default ProposedQueryActions;
