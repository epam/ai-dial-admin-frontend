'use client';

import { FC, useMemo, useState } from 'react';

import classNames from 'classnames';
import { DialDropdown, DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronRight, IconMathFunction } from '@tabler/icons-react';

import CompactInput from '@/src/components/Analytics/QueryBuilder/Common/CompactInput';
import FieldDropdownOption from '@/src/components/Analytics/QueryBuilder/Common/FieldDropdownOption';
import SectionAction from '@/src/components/Analytics/QueryBuilder/Common/SectionAction';
import { groupFieldOptions } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { UNTAGGED_KEY } from '@/src/constants/analytics/query-builder';
import { FIELD_GROUP_COLOR_CYCLE, QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  FieldDropdownMode,
  FieldOption,
  FunctionOption,
  QueryBuilderColor,
} from '@/src/models/analytics/query-builder';

const GROUP_TEXT_CLASSES = FIELD_GROUP_COLOR_CYCLE.map((c) => QUERY_BUILDER_PALETTE[c].text);
const GROUP_DOT_CLASSES = FIELD_GROUP_COLOR_CYCLE.map((c) => QUERY_BUILDER_PALETTE[c].marker);
const FUNCTIONS_GROUP_KEY = '__functions__';
const FUNCTIONS_TEXT_CLASS = QUERY_BUILDER_PALETTE[QueryBuilderColor.Grouping].text;

interface CommonProps {
  id: string;
  options: FieldOption[];
  onSelect: (name: string) => void;
  // Scalar functions listed in their own collapsible group above the columns.
  functions?: FunctionOption[];
  onSelectFunction?: (name: string) => void;
  ariaLabel: string;
  disabled?: boolean;
}

// The mode decides which of the trigger's inputs exist, so they travel with it: a picker needs a
// value to display, an add trigger needs its label, and only multi-add carries a selection.
interface PickerProps extends CommonProps {
  mode: FieldDropdownMode.Picker;
  value?: string;
  placeholder?: string;
  // Trigger label for the empty value ('') — e.g. the aggregates' "(No arg — count *)". Display
  // only: the option list holds real fields.
  emptyOptionLabel?: string;
}

interface AddProps extends CommonProps {
  mode: FieldDropdownMode.Add;
  addLabel: string;
}

interface MultiAddProps extends CommonProps {
  mode: FieldDropdownMode.MultiAdd;
  addLabel: string;
  // The field names currently in the section's list. Picking one toggles it.
  selected: string[];
}

type Props = PickerProps | AddProps | MultiAddProps;

interface GroupHeaderProps {
  expanded: boolean;
  count: number;
  textClassName: string;
  dot?: string;
  label: string;
  onToggle: () => void;
}

const GroupHeader: FC<GroupHeaderProps> = ({ expanded, count, textClassName, dot, label, onToggle }) => (
  <button
    type="button"
    aria-expanded={expanded}
    className={classNames(
      'flex w-full items-center gap-1.5 rounded px-2 pb-1 pt-2 text-left uppercase tracking-wide dial-tiny-semi-text hover:bg-layer-4',
      textClassName,
    )}
    onClick={onToggle}
  >
    {expanded ? (
      <IconChevronDown size={12} className="shrink-0" />
    ) : (
      <IconChevronRight size={12} className="shrink-0" />
    )}
    {dot && <span aria-hidden className={classNames('size-1.5 rounded-sm', dot)} />}
    <span className="min-w-0 flex-1 truncate">{label}</span>
    <span className="shrink-0 normal-case text-secondary">{count}</span>
  </button>
);

const CategorizedFieldDropdown: FC<Props> = (props) => {
  const { id, mode, options, onSelect, functions, onSelectFunction, ariaLabel, disabled } = props;
  const t = useI18n();
  const isMulti = mode === FieldDropdownMode.MultiAdd;
  const value = mode === FieldDropdownMode.Picker ? props.value : undefined;
  const selected = isMulti ? props.selected : undefined;
  const selectedNames = useMemo(() => new Set(selected ?? []), [selected]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  // Accordion: at most one category open at a time keeps the overlay height bounded without a
  // scroll cap. null = everything collapsed.
  const [expandedTag, setExpandedTag] = useState<string | null>(null);

  const groups = useMemo(() => groupFieldOptions(options, search), [options, search]);
  const term = search.trim().toLowerCase();
  const visibleFunctions = useMemo(
    () =>
      (functions || []).filter(
        (f) =>
          !term || f.name.includes(term) || f.label.toLowerCase().includes(term) || f.hint.toLowerCase().includes(term),
      ),
    [functions, term],
  );

  // A flat option set (nothing tagged) reads better without a lone "untagged" header — and without
  // collapsing, since there is only one group.
  const showHeaders = !!functions?.length || !(groups.length === 1 && groups[0].tag === UNTAGGED_KEY);
  // Searching overrides the collapse state: matches must be visible to be picked.
  const isExpanded = (key: string) => !showHeaders || !!term || expandedTag === key;

  const onToggleGroup = (key: string) => {
    setExpandedTag((prev) => (prev === key ? null : key));
  };

  const onOpenChange = (next: boolean) => {
    if (next) {
      setSearch('');
      // Start with only the group holding the current selection open (if any).
      const selectedGroup = value ? groups.find((g) => g.options.some((o) => o.name === value)) : undefined;
      setExpandedTag(selectedGroup?.tag ?? null);
    }
    setOpen(next);
  };

  // Multi-select keeps the overlay — and with it the search term and expanded category — open across
  // picks, so a section can be filled in one visit.
  const onPick = (name: string) => {
    onSelect(name);
    if (!isMulti) setOpen(false);
  };

  const valueLabel = value ? options.find((o) => o.name === value)?.display_name || value : value;

  const onPickFunction = (name: string) => {
    onSelectFunction?.(name);
    setOpen(false);
  };

  return (
    <DialDropdown
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
      placement="bottom-start"
      renderOverlay={() => (
        <div className="flex max-h-[70vh] w-[400px] max-w-[90vw] flex-col rounded border border-secondary bg-layer-0 shadow-lg">
          <div className="border-b border-primary p-1.5">
            <CompactInput
              ariaLabel={t(QueryBuilderI18nKey.SearchFields)}
              className="w-full"
              value={search}
              placeholder={t(QueryBuilderI18nKey.SearchFields)}
              onChange={setSearch}
            />
          </div>
          <div
            id={`${id}-listbox`}
            className="min-h-0 flex-1 overflow-y-auto p-1"
            role="listbox"
            aria-label={ariaLabel}
            aria-multiselectable={isMulti || undefined}
          >
            {!!visibleFunctions.length && (
              <div className="border-b border-primary pb-1">
                <GroupHeader
                  expanded={isExpanded(FUNCTIONS_GROUP_KEY)}
                  count={visibleFunctions.length}
                  textClassName={FUNCTIONS_TEXT_CLASS}
                  label={t(QueryBuilderI18nKey.Functions)}
                  onToggle={() => onToggleGroup(FUNCTIONS_GROUP_KEY)}
                />
                {isExpanded(FUNCTIONS_GROUP_KEY) &&
                  visibleFunctions.map((fn) => (
                    <DialTooltip
                      key={fn.name}
                      hideTooltip={!fn.hint}
                      tooltip={fn.hint}
                      triggerClassName="w-full"
                      contentClassName="max-w-[320px]"
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={false}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 pl-6 text-left hover:bg-layer-4"
                        onClick={() => onPickFunction(fn.name)}
                      >
                        <IconMathFunction size={12} className={classNames('shrink-0', FUNCTIONS_TEXT_CLASS)} />
                        <span className="shrink-0 font-mono dial-tiny-text text-primary">{fn.label}</span>
                        <span className="min-w-0 flex-1 truncate dial-tiny-text text-secondary">{fn.hint}</span>
                      </button>
                    </DialTooltip>
                  ))}
              </div>
            )}
            {!!functions?.length && !!groups.length && (
              <div className="px-2 pb-1 pt-2 uppercase tracking-wide dial-tiny-semi-text text-secondary">
                {t(QueryBuilderI18nKey.Columns)}
              </div>
            )}
            {groups.map((group, groupIndex) => (
              <div key={group.tag}>
                {showHeaders && (
                  <GroupHeader
                    expanded={isExpanded(group.tag)}
                    count={group.options.length}
                    textClassName={GROUP_TEXT_CLASSES[groupIndex % GROUP_TEXT_CLASSES.length]}
                    dot={GROUP_DOT_CLASSES[groupIndex % GROUP_DOT_CLASSES.length]}
                    label={group.tag === UNTAGGED_KEY ? t(QueryBuilderI18nKey.Untagged) : group.tag}
                    onToggle={() => onToggleGroup(group.tag)}
                  />
                )}
                {isExpanded(group.tag) &&
                  group.options.map((option) => (
                    <FieldDropdownOption
                      key={option.name}
                      option={option}
                      selected={isMulti ? selectedNames.has(option.name) : option.name === value}
                      onPick={() => onPick(option.name)}
                    />
                  ))}
              </div>
            ))}
            {!groups.length && !visibleFunctions.length && (
              <div className="p-3 dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.NoMatchingFields)}</div>
            )}
          </div>
        </div>
      )}
    >
      {mode === FieldDropdownMode.Picker ? (
        <button
          type="button"
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          disabled={disabled}
          className="flex h-[26px] w-full items-center justify-between gap-2 rounded border border-primary bg-layer-2 px-2 text-left hover:bg-layer-4"
        >
          <span className={classNames('truncate font-mono dial-tiny-text', value ? 'text-primary' : 'text-secondary')}>
            {valueLabel || props.emptyOptionLabel || props.placeholder}
          </span>
          <IconChevronDown size={12} className="shrink-0 text-secondary" />
        </button>
      ) : (
        <SectionAction
          label={props.addLabel}
          ariaLabel={ariaLabel}
          disabled={disabled}
          expanded={open}
          controls={`${id}-listbox`}
        />
      )}
    </DialDropdown>
  );
};

export default CategorizedFieldDropdown;
