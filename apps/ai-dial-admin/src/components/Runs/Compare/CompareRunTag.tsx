'use client';

import { IconPencilMinus } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC } from 'react';

import { DialTag } from '@epam/ai-dial-ui-kit';

import CompareRunIndexBadge from '@/src/components/Runs/Compare/CompareRunIndexBadge';
import { RUN_COMPARE_PRIMARY_INDEX, RUN_COMPARE_SECONDARY_INDEX } from '@/src/components/Runs/Compare/constants';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  runIndex: typeof RUN_COMPARE_PRIMARY_INDEX | typeof RUN_COMPARE_SECONDARY_INDEX;
  name: string;
  onEdit: () => void;
  isEditDisabled?: boolean;
}

const CompareRunTag: FC<Props> = ({ runIndex, name, onEdit, isEditDisabled }) => {
  const t = useI18n();
  const ariaLabel = t(RunsI18nKey.RunCompareTagAria, { index: runIndex, name });

  return (
    <DialTag
      aria-label={ariaLabel}
      label=""
      icon={
        <span className={classNames('inline-flex items-center gap-1', isEditDisabled && 'opacity-50')}>
          <CompareRunIndexBadge runIndex={runIndex} />
          <span>{name}</span>
          <IconPencilMinus size={16} className="shrink-0 text-secondary" />
        </span>
      }
      onClick={isEditDisabled ? undefined : onEdit}
      className={classNames(
        'bg-layer-3 border-0 gap-1',
        isEditDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      )}
    />
  );
};

export default CompareRunTag;
