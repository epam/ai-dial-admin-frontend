'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import FilterChip from '@/src/components/Common/FilterEditor/FilterChip';
import FilterEditorPopover from '@/src/components/Common/FilterEditor/FilterEditorPopover';

import CreateRunConditionFilter from './CreateRunConditionFilter';
import { RunConditionFieldOption, RunConditionFilter } from './models';
import { getOperatorIcon, isRunConditionFilterComplete } from './utils';

interface Props {
  filter: RunConditionFilter;
  fieldOptions: RunConditionFieldOption[];
  onEdit: (filter: RunConditionFilter) => void;
  onRemove: () => void;
}

const RunConditionChip: FC<Props> = ({ filter, fieldOptions, onEdit, onRemove }) => {
  const [draft, setDraft] = useState(filter);

  const filledPredicates = useMemo(() => filter.predicates.filter((p) => p.value.trim() !== ''), [filter.predicates]);

  const chipBody = useMemo(() => {
    if (filledPredicates.length > 1) {
      return (
        <span className="mr-1">
          {filter.displayName} ({filledPredicates.length})
        </span>
      );
    }
    const predicate = filledPredicates[0];
    return (
      <>
        <span className="mr-1">{filter.displayName}</span>
        {predicate ? <i className="mr-1">{getOperatorIcon(predicate.operator)}</i> : null}
        {predicate ? <span className="mr-1 max-w-[250px] break-words">{predicate.value}</span> : null}
      </>
    );
  }, [filledPredicates, filter.displayName]);

  const onCommit = useCallback(() => {
    onEdit(draft);
  }, [draft, onEdit]);

  const onCancel = useCallback(() => {
    setDraft(filter);
  }, [filter]);

  return (
    <FilterEditorPopover
      isComplete={isRunConditionFilterComplete(draft)}
      onCommit={onCommit}
      onCancel={onCancel}
      editor={() => (
        <CreateRunConditionFilter draft={draft} fieldOptions={fieldOptions} onChange={setDraft} onClear={onRemove} />
      )}
    >
      <FilterChip onRemove={onRemove}>{chipBody}</FilterChip>
    </FilterEditorPopover>
  );
};

export default RunConditionChip;
