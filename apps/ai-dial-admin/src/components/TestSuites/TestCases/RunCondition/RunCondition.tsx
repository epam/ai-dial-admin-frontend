'use client';

import { DialGhostButton, DialTooltip, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle, IconPlus } from '@tabler/icons-react';
import { FC, useCallback, useMemo, useState } from 'react';

import FilterEditorPopover from '@/src/components/Common/FilterEditor/FilterEditorPopover';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { FilterNode } from '@/src/models/evaluation/structured-query';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';

import CreateRunConditionFilter from './CreateRunConditionFilter';
import RunConditionChip from './RunConditionChip';
import { RunConditionFilter } from './models';
import {
  createEmptyRunConditionFilter,
  deserializeRunConditionFilters,
  getRunConditionFieldOptions,
  isRunConditionFilterComplete,
  serializeRunConditionFilters,
} from './utils';

interface Props {
  testCaseFilter?: FilterNode | null;
  schema?: TestCaseSchema[];
  onChange: (filter: FilterNode | null) => void;
}

const RunCondition: FC<Props> = ({ testCaseFilter, schema, onChange }) => {
  const t = useI18n();
  const fieldOptions = useMemo(() => getRunConditionFieldOptions(schema), [schema]);

  const filters = useMemo(() => deserializeRunConditionFilters(testCaseFilter, schema), [testCaseFilter, schema]);

  const [draft, setDraft] = useState(() => createEmptyRunConditionFilter());

  const persist = useCallback(
    (next: RunConditionFilter[]) => {
      onChange(serializeRunConditionFilters(next));
    },
    [onChange],
  );

  const onAdd = useCallback(() => {
    if (!isRunConditionFilterComplete(draft)) {
      return;
    }
    persist([...filters, draft]);
    setDraft(createEmptyRunConditionFilter());
  }, [draft, filters, persist]);

  const onCancelAdd = useCallback(() => {
    setDraft(createEmptyRunConditionFilter());
  }, []);

  const onEdit = useCallback(
    (index: number, filter: RunConditionFilter) => {
      const next = [...filters];
      next[index] = filter;
      persist(next.filter(isRunConditionFilterComplete));
    },
    [filters, persist],
  );

  const onRemove = useCallback(
    (index: number) => {
      persist(filters.filter((_, i) => i !== index));
    },
    [filters, persist],
  );

  return (
    <div className="flex flex-wrap items-center gap-1">
      <div className="flex items-center gap-0.5 mr-1">
        <span className="small-text-semi text-secondary whitespace-nowrap">{t(TestSuitesI18nKey.RunCondition)}</span>
        <DialTooltip tooltip={t(TestSuitesI18nKey.RunConditionTooltip)}>
          <IconInfoCircle {...BASE_BUTTON_ICON_PROPS} className="text-secondary" />
        </DialTooltip>
      </div>
      {filters.map((filter, index) => (
        <RunConditionChip
          key={filter.id}
          filter={filter}
          fieldOptions={fieldOptions}
          onEdit={(updated) => onEdit(index, updated)}
          onRemove={() => onRemove(index)}
        />
      ))}
      <FilterEditorPopover
        isComplete={isRunConditionFilterComplete(draft)}
        onCommit={onAdd}
        onCancel={onCancelAdd}
        editor={(onClose) => (
          <CreateRunConditionFilter draft={draft} fieldOptions={fieldOptions} onChange={setDraft} onClose={onClose} />
        )}
      >
        <DialGhostButton
          label={t(ButtonsI18nKey.Add)}
          iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
          size={ElementSize.Small}
        />
      </FilterEditorPopover>
    </div>
  );
};

export default RunCondition;
