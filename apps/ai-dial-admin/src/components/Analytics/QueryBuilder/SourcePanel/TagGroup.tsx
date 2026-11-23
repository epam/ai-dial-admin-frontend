'use client';

import { FC, useId } from 'react';

import { Badge } from '@epam/ai-dial-ui-kit';
import { IconCaretDownFilled, IconCaretRightFilled } from '@tabler/icons-react';

import ColumnRow from '@/src/components/Analytics/QueryBuilder/SourcePanel/ColumnRow';
import { useSourcePanel } from '@/src/components/Analytics/QueryBuilder/SourcePanel/context';
import { ColumnGroup } from '@/src/components/Analytics/QueryBuilder/SourcePanel/models';
import { getGroupKey } from '@/src/components/Analytics/QueryBuilder/SourcePanel/utils/source-panel';

interface Props {
  tableName: string;
  group: ColumnGroup;
}

const TagGroup: FC<Props> = ({ tableName, group }) => {
  const listId = useId();
  const { collapsedGroups, onToggleGroup } = useSourcePanel();

  const key = getGroupKey(tableName, group.tag);
  const isExpanded = !collapsedGroups.includes(key);
  const ToggleIcon = isExpanded ? IconCaretDownFilled : IconCaretRightFilled;

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={listId}
        className="flex h-8 w-full items-center gap-1 rounded-lg pl-8 pr-3 text-secondary hover:bg-accent-primary-alpha focus-visible:bg-accent-primary-alpha"
        onClick={() => onToggleGroup(key)}
      >
        <span className="flex size-4 shrink-0 items-center justify-center">
          <ToggleIcon size={12} aria-hidden />
        </span>
        <Badge label={group.tag} />
        <span className="ml-auto dial-tiny-text">{group.fields.length}</span>
      </button>
      {isExpanded && (
        <ul id={listId} className="flex flex-col gap-0.5">
          {group.fields.map((field) => (
            <ColumnRow key={field.name} field={field} isNested />
          ))}
        </ul>
      )}
    </div>
  );
};

export default TagGroup;
