'use client';

import { FC, useId } from 'react';

import { Badge } from '@epam/ai-dial-ui-kit';
import { IconCaretDownFilled, IconCaretRightFilled } from '@tabler/icons-react';

import QueryRow from '@/src/components/Analytics/QueryBuilder/SourcePanel/QueryRow';
import { useSourcePanel } from '@/src/components/Analytics/QueryBuilder/SourcePanel/context';
import { QueryGroup, QueryRowIndent } from '@/src/components/Analytics/QueryBuilder/SourcePanel/models';
import { getQueryGroupKey } from '@/src/components/Analytics/QueryBuilder/SourcePanel/utils/source-panel';
import { QuerySourcePanelI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  group: QueryGroup;
  currentQueryId?: string;
}

const QueryTagGroup: FC<Props> = ({ group, currentQueryId }) => {
  const t = useI18n();
  const listId = useId();
  const { collapsedGroups, onToggleGroup } = useSourcePanel();

  const key = getQueryGroupKey(group.tag);
  const isExpanded = !collapsedGroups.includes(key);
  const ToggleIcon = isExpanded ? IconCaretDownFilled : IconCaretRightFilled;

  return (
    <li className="flex flex-col gap-0.5">
      <button
        type="button"
        aria-label={t(QuerySourcePanelI18nKey.QueryTag, { tag: group.tag })}
        aria-expanded={isExpanded}
        aria-controls={isExpanded ? listId : undefined}
        className="flex h-8 w-full shrink-0 items-center gap-1 rounded-lg px-3 text-secondary hover:bg-control-accent-alpha focus-visible:bg-control-accent-alpha"
        onClick={() => onToggleGroup(key)}
      >
        <span className="flex size-4 shrink-0 items-center justify-center">
          <ToggleIcon size={12} aria-hidden />
        </span>
        <Badge label={group.tag} />
        <span className="ml-auto dial-tiny-text">{group.queries.length}</span>
      </button>
      {isExpanded && (
        <ul id={listId} className="flex flex-col gap-0.5">
          {group.queries.map((query) => (
            <QueryRow
              key={query.id}
              query={query}
              isCurrent={query.id === currentQueryId}
              indent={QueryRowIndent.Nested}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default QueryTagGroup;
