'use client';

import { IconPencilMinus } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC } from 'react';

import { Tag } from '@epam/ai-dial-ui-kit';

import CompareRunIndexBadge from '@/src/components/Runs/Compare/CompareRunIndexBadge';
import { CompareRun } from '@/src/components/Runs/Compare/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  run: CompareRun;
  onEdit: () => void;
  isEditDisabled?: boolean;
}

const CompareRunTag: FC<Props> = ({ run, onEdit, isEditDisabled }) => {
  const t = useI18n();
  const { index, name, isBaseline } = run;
  const displayName = isBaseline ? t(RunsI18nKey.RunComparePrimaryRunName, { name }) : name;
  const ariaLabel = isBaseline
    ? t(RunsI18nKey.RunComparePrimaryTagAria, { index, name })
    : t(RunsI18nKey.RunCompareTagAria, { index, name });

  return (
    <Tag
      aria-label={ariaLabel}
      label=""
      icon={
        <span className={classNames('inline-flex items-center gap-1', isEditDisabled && 'opacity-50')}>
          <CompareRunIndexBadge runIndex={index} />
          <span>{displayName}</span>
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
