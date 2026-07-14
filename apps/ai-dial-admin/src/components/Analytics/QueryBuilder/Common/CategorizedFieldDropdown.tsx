'use client';

import { FC, useMemo, useState } from 'react';

import classNames from 'classnames';
import { DialDropdown, DialSearch } from '@epam/ai-dial-ui-kit';
import { IconChevronDown } from '@tabler/icons-react';

import SectionAction from '@/src/components/Analytics/QueryBuilder/Common/SectionAction';
import { groupFieldOptions } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { UNTAGGED_KEY } from '@/src/constants/analytics/query-builder';
import { FIELD_GROUP_COLOR_CYCLE, QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { FieldOption } from '@/src/models/analytics/query-builder';

const GROUP_TEXT_CLASSES = FIELD_GROUP_COLOR_CYCLE.map((c) => QUERY_BUILDER_PALETTE[c].text);
const GROUP_DOT_CLASSES = FIELD_GROUP_COLOR_CYCLE.map((c) => QUERY_BUILDER_PALETTE[c].marker);

interface Props {
  id: string;
  options: FieldOption[];
  onSelect: (name: string) => void;
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

const CategorizedFieldDropdown: FC<Props> = ({
  id,
  options,
  onSelect,
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

  const groups = useMemo(() => groupFieldOptions(options, search), [options, search]);
  // A flat option set (nothing tagged) reads better without a lone "untagged" header.
  const showHeaders = !(groups.length === 1 && groups[0].tag === UNTAGGED_KEY);

  const onOpenChange = (next: boolean) => {
    if (next) setSearch('');
    setOpen(next);
  };

  const onPick = (name: string) => {
    onSelect(name);
    setOpen(false);
  };

  return (
    <DialDropdown
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
      placement="bottom-start"
      renderOverlay={() => (
        <div className="flex max-h-[320px] w-full min-w-[280px] flex-col rounded border border-secondary bg-layer-0 shadow-lg">
          <div className="border-b border-primary p-2">
            <DialSearch
              id={`${id}-search`}
              value={search}
              placeholder={t(QueryBuilderI18nKey.SearchFields)}
              onChange={setSearch}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-1" role="listbox" aria-label={ariaLabel}>
            {groups.map((group, groupIndex) => (
              <div key={group.tag}>
                {showHeaders && (
                  <div
                    className={classNames(
                      'flex items-center gap-1.5 px-2 pb-1 pt-2 uppercase tracking-wide dial-tiny-semi-text',
                      GROUP_TEXT_CLASSES[groupIndex % GROUP_TEXT_CLASSES.length],
                    )}
                  >
                    <span
                      aria-hidden
                      className={classNames(
                        'size-1.5 rounded-sm',
                        GROUP_DOT_CLASSES[groupIndex % GROUP_DOT_CLASSES.length],
                      )}
                    />
                    {group.tag === UNTAGGED_KEY ? t(QueryBuilderI18nKey.Untagged) : group.tag}
                  </div>
                )}
                {group.options.map((option) => (
                  <button
                    key={option.name}
                    type="button"
                    role="option"
                    aria-selected={option.name === value}
                    className={classNames(
                      'flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left hover:bg-layer-4',
                      option.name === value && 'bg-accent-primary-alpha',
                    )}
                    onClick={() => onPick(option.name)}
                  >
                    <span className="truncate font-mono dial-tiny-text text-primary">{option.name}</span>
                    {option.type && <span className="shrink-0 dial-tiny-text text-secondary">{option.type}</span>}
                  </button>
                ))}
              </div>
            ))}
            {!groups.length && (
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
            {value || emptyOptionLabel || placeholder}
          </span>
          <IconChevronDown size={12} className="shrink-0 text-secondary" />
        </button>
      )}
    </DialDropdown>
  );
};

export default CategorizedFieldDropdown;
