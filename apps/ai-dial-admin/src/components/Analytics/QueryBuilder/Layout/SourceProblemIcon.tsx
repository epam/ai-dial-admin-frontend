'use client';

import { FC } from 'react';

import { Tooltip, TooltipPlacement } from '@epam/ai-dial-ui-kit';
import { IconAlertTriangle } from '@tabler/icons-react';

import { QueriesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { QuerySourceProblem } from '@/src/models/analytics/query-builder';

interface Props {
  problem: QuerySourceProblem;
}

const PROBLEM_I18N: Record<QuerySourceProblem, QueriesI18nKey> = {
  [QuerySourceProblem.Unavailable]: QueriesI18nKey.SourceUnavailable,
  [QuerySourceProblem.SchemaFailed]: QueriesI18nKey.SourceSchemaFailed,
};

const SourceProblemIcon: FC<Props> = ({ problem }) => {
  const t = useI18n();
  const text = t(PROBLEM_I18N[problem]);

  return (
    <Tooltip asChild placement={TooltipPlacement.Right} tooltip={text} contentClassName="max-w-[320px]">
      <span
        role="img"
        aria-label={text}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className="inline-flex shrink-0 rounded text-warning focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
      >
        <IconAlertTriangle size={16} aria-hidden />
      </span>
    </Tooltip>
  );
};

export default SourceProblemIcon;
