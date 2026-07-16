'use client';

import { FC, useMemo, useState } from 'react';

import classNames from 'classnames';
import { DialDropdown, DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronRight, IconMathFunction } from '@tabler/icons-react';

import CompactInput from '@/src/components/Analytics/QueryBuilder/Common/CompactInput';
import SectionAction from '@/src/components/Analytics/QueryBuilder/Common/SectionAction';
import SensitiveIndicator from '@/src/components/Common/SensitiveIndicator/SensitiveIndicator';
import { groupFieldOptions } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { UNTAGGED_KEY } from '@/src/constants/analytics/query-builder';
import { FIELD_GROUP_COLOR_CYCLE, QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';
import { AnalyticsTablesI18nKey, QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { FieldOption, FunctionOption, QueryBuilderColor } from '@/src/models/analytics/query-builder';

const GROUP_TEXT_CLASSES = FIELD_GROUP_COLOR_CYCLE.map((c) => QUERY_BUILDER_PALETTE[c].text);
const GROUP_DOT_CLASSES = FIELD_GROUP_COLOR_CYCLE.map((c) => QUERY_BUILDER_PALETTE[c].marker);
const FUNCTIONS_GROUP_KEY = '__functions__';
const FUNCTIONS_TEXT_CLASS = QUERY_BUILDER_PALETTE[QueryBuilderColor.Grouping].text;

interface Props {
  id: string;
  options: FieldOption[];
  onSelect: (name: string) => void;
  // Scalar functions listed in their own collapsible group above the columns.
  functions?: FunctionOption[];
  onSelectFunction?: (name: string) => void;
  // Add mode: a "+ Add"-style ghost trigger. Picker mode (default): a select-like trigger showing `value`.
  addLabel?: string;
  value?: string;
  placeholder?: string;
  ariaLabel: string;
  disabled?: boolean;
  // Trigger label for the empty value ('') — e.g. the aggregates' "(No arg — count *)". Display
  // only: the option list holds real fields.
  emptyOptionLabel?: string;
}

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

const CategorizedFieldDropdown: FC<Props> = ({
  id,
  options,
  onSelect,
  functions,
  onSelectFunction,
  addLabel,
  value,
  placeholder,
  ariaLabel,
  disabled,
  emptyOptionLabel,
}) => {
  const t = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  // Accordion: at most one category open at a time keeps the overlay height bounded without a
  // scroll cap. null = everything collapsed.
  const [expandedTag, setExpandedTag] = useState<string | null>(null);

  const groups = useMemo(() => groupFieldOptions(options, search), [options, search]);
  const term = search.trim().toLowerCase();
  const visibleFunctions = useMemo(
    () => (functions || []).filter((f) => !term || f.name.includes(term) || f.hint.toLowerCase().includes(term)),
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

  const onPick = (name: string) => {
    onSelect(name);
    setOpen(false);
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
                    <button
                      key={fn.name}
                      type="button"
                      role="option"
                      aria-selected={false}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 pl-6 text-left hover:bg-layer-4"
                      onClick={() => onPickFunction(fn.name)}
                    >
                      <IconMathFunction size={12} className={classNames('shrink-0', FUNCTIONS_TEXT_CLASS)} />
                      <span className="truncate font-mono dial-tiny-text text-primary">{fn.name}</span>
                      <span className="shrink-0 dial-tiny-text text-secondary">{fn.hint}</span>
                    </button>
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
                  group.options.map((option) => {
                    // One row-level tooltip carries both the sensitive note (when sensitive) and the
                    // full description; the dot renders without its own tooltip so they don't nest.
                    const rowTooltip = [option.sensitive && t(AnalyticsTablesI18nKey.Sensitive), option.description]
                      .filter(Boolean)
                      .join(' — ');
                    return (
                      <DialTooltip
                        key={option.name}
                        hideTooltip={!rowTooltip}
                        tooltip={rowTooltip}
                        triggerClassName="w-full"
                        contentClassName="max-w-[320px]"
                      >
                        <button
                          type="button"
                          role="option"
                          aria-selected={option.name === value}
                          className={classNames(
                            'flex w-full flex-col gap-0.5 rounded px-2 py-1.5 text-left hover:bg-layer-4',
                            showHeaders && 'pl-6',
                            option.name === value && 'bg-accent-primary-alpha',
                          )}
                          onClick={() => onPick(option.name)}
                        >
                          <span className="flex w-full items-center justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-1.5">
                              <span className="truncate font-mono dial-tiny-text text-primary">
                                {option.display_name || option.name}
                              </span>
                              {option.sensitive && <SensitiveIndicator />}
                            </span>
                            {option.type && (
                              <span className="shrink-0 dial-tiny-text text-secondary">{option.type}</span>
                            )}
                          </span>
                          {option.description && (
                            <span className="w-full truncate dial-tiny-text text-secondary">{option.description}</span>
                          )}
                        </button>
                      </DialTooltip>
                    );
                  })}
              </div>
            ))}
            {!groups.length && !visibleFunctions.length && (
              <div className="p-3 dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.NoMatchingFields)}</div>
            )}
          </div>
        </div>
      )}
    >
      {addLabel ? (
        <SectionAction label={addLabel} ariaLabel={ariaLabel} disabled={disabled} />
      ) : (
        <button
          type="button"
          aria-label={ariaLabel}
          disabled={disabled}
          className="flex h-[26px] w-full items-center justify-between gap-2 rounded border border-primary bg-layer-2 px-2 text-left hover:bg-layer-4"
        >
          <span className={classNames('truncate font-mono dial-tiny-text', value ? 'text-primary' : 'text-secondary')}>
            {valueLabel || emptyOptionLabel || placeholder}
          </span>
          <IconChevronDown size={12} className="shrink-0 text-secondary" />
        </button>
      )}
    </DialDropdown>
  );
};

export default CategorizedFieldDropdown;
