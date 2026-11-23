'use client';

import { FC, useLayoutEffect, useRef, useState } from 'react';

import { Tooltip, TooltipPlacement } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import Link from 'next/link';

import ScopeBadge from '@/src/components/Analytics/QueryBuilder/Common/ScopeBadge';
import { useSourcePanel } from '@/src/components/Analytics/QueryBuilder/SourcePanel/context';
import { QueryRowIndent } from '@/src/components/Analytics/QueryBuilder/SourcePanel/models';
import { useCurrentLocale } from '@/src/locales/client';
import { SavedQuery } from '@/src/models/analytics/saved-query';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

const INDENT_CLASS_NAME: Record<QueryRowIndent, string> = {
  [QueryRowIndent.Root]: 'pl-3',
  [QueryRowIndent.BesideGroups]: 'pl-8',
  [QueryRowIndent.Nested]: 'pl-12',
};

interface Props {
  query: SavedQuery;
  isCurrent: boolean;
  indent?: QueryRowIndent;
}

const QueryRow: FC<Props> = ({ query, isCurrent, indent = QueryRowIndent.Root }) => {
  const locale = useCurrentLocale();
  const { onNavigate } = useSourcePanel();
  const nameRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const href = `/${locale}${getUrnForEntity(ApplicationRoute.AnalyticsQueries, query)}`;

  useLayoutEffect(() => {
    const element = nameRef.current;
    setIsTruncated(!!element && element.scrollWidth > element.clientWidth);
  }, [query.name]);

  return (
    <li>
      <Tooltip
        asChild
        placement={TooltipPlacement.Right}
        contentClassName="max-w-[320px]"
        tooltip={
          <span className="flex flex-col items-start gap-1">
            {isTruncated && <span className="[overflow-wrap:anywhere]">{query.name}</span>}
            <ScopeBadge scope={query.scope} />
            {query.description && <span>{query.description}</span>}
          </span>
        }
      >
        <Link
          href={href}
          aria-current={isCurrent ? 'page' : undefined}
          className={classNames(
            'flex min-h-8 min-w-0 items-center rounded-lg py-1 pr-3 text-primary dial-tiny-text hover:bg-accent-primary-alpha focus-visible:bg-accent-primary-alpha',
            INDENT_CLASS_NAME[indent],
            isCurrent && 'bg-accent-primary-alpha',
          )}
          onClick={(event) => onNavigate(event, href)}
        >
          <span ref={nameRef} className="truncate">
            {query.name}
          </span>
        </Link>
      </Tooltip>
    </li>
  );
};

export default QueryRow;
