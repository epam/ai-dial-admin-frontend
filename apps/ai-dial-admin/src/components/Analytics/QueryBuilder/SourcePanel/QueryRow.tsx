'use client';

import { FC } from 'react';

import { Badge, Tooltip, TooltipPlacement } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import Link from 'next/link';

import { useSourcePanel } from '@/src/components/Analytics/QueryBuilder/SourcePanel/context';
import { SAVED_QUERY_SCOPE_I18N } from '@/src/constants/analytics/queries';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { SavedQuery } from '@/src/models/analytics/saved-query';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

interface Props {
  query: SavedQuery;
  isCurrent: boolean;
  isNested?: boolean;
}

const QueryRow: FC<Props> = ({ query, isCurrent, isNested = false }) => {
  const t = useI18n();
  const locale = useCurrentLocale();
  const { onNavigate } = useSourcePanel();

  const href = `/${locale}${getUrnForEntity(ApplicationRoute.AnalyticsQueries, query)}`;

  return (
    <li>
      <Tooltip
        asChild
        placement={TooltipPlacement.Right}
        contentClassName="max-w-[320px]"
        tooltip={
          <span className="flex flex-col items-start gap-1">
            <Badge label={t(SAVED_QUERY_SCOPE_I18N[query.scope])} />
            {query.description && <span>{query.description}</span>}
          </span>
        }
      >
        <Link
          href={href}
          aria-current={isCurrent ? 'page' : undefined}
          className={classNames(
            'flex min-h-8 items-center rounded py-1 pr-3 text-primary dial-tiny-text [overflow-wrap:anywhere] hover:bg-accent-primary-alpha focus-visible:bg-accent-primary-alpha',
            isNested ? 'pl-8' : 'pl-3',
            isCurrent && 'bg-accent-primary-alpha',
          )}
          onClick={(event) => onNavigate(event, href)}
        >
          {query.name}
        </Link>
      </Tooltip>
    </li>
  );
};

export default QueryRow;
