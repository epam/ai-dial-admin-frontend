'use client';

import { ButtonAppearance, DialCheckbox, DialInput, DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconSearch } from '@tabler/icons-react';
import { CustomFilterProps, useGridFilter } from 'ag-grid-react';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ButtonsI18nKey, ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  ConversationFieldValue,
  ConversationGridContext,
  ConversationRow,
  ConversationValueFilterModel,
  ConversationValuesState,
} from '@/src/models/analytics/conversations-trace';
import { formatCompactNumber } from '@/src/utils/analytics/conversation-formatting';

const STATE_MESSAGE_KEY: Partial<Record<ConversationValuesState, string>> = {
  [ConversationValuesState.Loading]: ConversationsTraceI18nKey.ValueFilterLoading,
  [ConversationValuesState.Empty]: ConversationsTraceI18nKey.ValueFilterEmpty,
  [ConversationValuesState.LoadFailed]: ConversationsTraceI18nKey.ValueFilterLoadFailed,
};

// Above this many values, reading the list is slower than typing at it. Matches the threshold the shared
// list popup uses (`Multiselect`'s modal content), so the two controls appear to have the same rule.
const SEARCH_THRESHOLD = 10;

type Props = CustomFilterProps<ConversationRow, ConversationGridContext, ConversationValueFilterModel>;

/**
 * Lists an enum-typed column's values for selection, with each value's count, in place of a free-text entry.
 *
 * Written rather than configured because `agSetColumnFilter` is an AG Grid Enterprise module and this repo
 * has the community package. AG Grid supplies the popup and the filter lifecycle; this supplies the list.
 *
 * The chrome deliberately copies `Grid/Filter/GridFilterDropdown` — the same `bg-layer-4` surface, the same
 * `w-[205px]`/`p-3`/`gap-2` box, the same outlined Reset — because that is the overlay every other filter in
 * this app opens. Rows are the 1.0 `DialCheckbox` with a plain string label and an 8px gap, exactly as
 * `Common/Lists/CheckboxList` renders them, so a list of values looks the same here as everywhere else.
 *
 * The checkbox's own typography is left alone. An earlier pass used the 2.0 `Checkbox` — a taller control
 * built for forms — and then nested a smaller span inside its label to compensate, which is two mistakes:
 * the wrong control, and then overriding the control's type scale from the outside. The trailing count is
 * sized to the label it sits beside rather than to a scale of its own.
 */
const ConversationValueFilter: FC<Props> = ({ model, onModelChange, colDef, context }) => {
  const t = useI18n();

  const [state, setState] = useState(ConversationValuesState.Loading);
  const [values, setValues] = useState<ConversationFieldValue[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const fieldName = colDef.field as string;
  const selected = useMemo(() => model?.values ?? [], [model]);

  const requestValuesRef = useRef(context.requestFieldValues);
  requestValuesRef.current = context.requestFieldValues;

  // Filtering is resolved by the query, so no row on screen is ever tested against this filter. The grid's
  // filter interface requires the callback all the same.
  const doesFilterPass = useCallback(() => true, []);
  const afterGuiAttached = useCallback(() => setIsOpen(true), []);
  const afterGuiDetached = useCallback(() => setIsOpen(false), []);

  useGridFilter({ doesFilterPass, afterGuiAttached, afterGuiDetached });

  // Resolved on every opening rather than once: the list is faceted against the page's other narrowing, so
  // one held from a previous filter state would state counts that no longer match the rows it returns.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isCurrent = true;
    setState(ConversationValuesState.Loading);
    // A term left over from the previous opening would silently hide values from a list that has since been
    // re-resolved against different narrowing.
    setSearch('');

    const read = async () => {
      const resolved = await requestValuesRef.current(fieldName);
      if (!isCurrent) {
        return;
      }
      setValues(resolved ?? []);
      if (!resolved) {
        setState(ConversationValuesState.LoadFailed);
        return;
      }
      setState(resolved.length ? ConversationValuesState.Available : ConversationValuesState.Empty);
    };

    void read();

    return () => {
      isCurrent = false;
    };
  }, [fieldName, isOpen]);

  // Presentational only: narrowing what renders never changes what is selected, so clearing the term brings
  // the hidden values back with their selection intact.
  const visibleValues = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? values.filter((fieldValue) => fieldValue.value.toLowerCase().includes(term)) : values;
  }, [search, values]);

  const onToggleValue = useCallback(
    (value: string, isSelected?: boolean) => {
      const next = isSelected ? [...selected, value] : selected.filter((current) => current !== value);
      // A null model deactivates the column's filter — the same state a text entry left blank is in. A model
      // holding an empty list would keep the filter active and narrow by nothing.
      onModelChange(next.length ? { values: next } : null);
    },
    [onModelChange, selected],
  );

  const selectedVisibleCount = visibleValues.filter((fieldValue) => selected.includes(fieldValue.value)).length;
  const areAllVisibleSelected = visibleValues.length > 0 && selectedVisibleCount === visibleValues.length;

  // Acts on what is on screen, so a term plus select-all selects that subset rather than the whole column.
  // With no term on screen that is the whole list, which is the case the control mainly exists for.
  const onToggleAllVisible = useCallback(() => {
    const visible = visibleValues.map((fieldValue) => fieldValue.value);
    const next = areAllVisibleSelected
      ? selected.filter((value) => !visible.includes(value))
      : [...selected, ...visible.filter((value) => !selected.includes(value))];
    onModelChange(next.length ? { values: next } : null);
  }, [areAllVisibleSelected, onModelChange, selected, visibleValues]);

  const onReset = useCallback(() => {
    setSearch('');
    onModelChange(null);
  }, [onModelChange]);

  const messageKey = STATE_MESSAGE_KEY[state];
  const isAvailable = state === ConversationValuesState.Available;

  return (
    <div className="flex w-[205px] flex-col gap-2 bg-layer-4 p-3">
      {/* Always mounted so a transition between states is announced rather than only redrawn. Kept separate
          from every control's own label: the labels stay stable while this carries the transient message. */}
      <span
        role="status"
        aria-live="polite"
        className={classNames(
          'dial-tiny-text',
          state === ConversationValuesState.LoadFailed ? 'text-error' : 'text-secondary',
        )}
      >
        {messageKey ? t(messageKey) : ''}
      </span>
      {isAvailable && values.length > SEARCH_THRESHOLD && (
        <DialInput
          id={`value-filter-search-${fieldName}`}
          placeholder={t(ConversationsTraceI18nKey.ValueFilterSearch)}
          value={search}
          iconBefore={<IconSearch size={16} aria-hidden />}
          onChange={(next) => setSearch(next ?? '')}
        />
      )}
      {isAvailable && (
        <>
          <DialCheckbox
            id={`value-filter-all-${fieldName}`}
            checked={areAllVisibleSelected}
            indeterminate={selectedVisibleCount > 0 && !areAllVisibleSelected}
            label={t(ConversationsTraceI18nKey.ValueFilterSelectAll)}
            onChange={onToggleAllVisible}
          />
          <div
            role="group"
            aria-label={t(ConversationsTraceI18nKey.ValueFilterGroup, { column: colDef.headerName ?? fieldName })}
            className="flex max-h-[240px] flex-col gap-2 overflow-y-auto border-t border-tertiary pt-2"
          >
            {visibleValues.map((fieldValue) => (
              <div key={fieldValue.value} className="flex items-center justify-between gap-2">
                {/* The value alone is the checkbox's accessible name — it is what a selection means, and a
                    name carrying the count would rename the same option every time the data moves. The
                    count sits outside the label, still readable, as its own trailing element. */}
                <DialCheckbox
                  id={`value-filter-${fieldName}-${fieldValue.value}`}
                  checked={selected.includes(fieldValue.value)}
                  label={fieldValue.value}
                  onChange={(isSelected) => onToggleValue(fieldValue.value, isSelected)}
                />
                {fieldValue.count != null && (
                  <span className="shrink-0 dial-small-text text-secondary">
                    {formatCompactNumber(fieldValue.count)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      <div className="flex items-center justify-end">
        <DialNeutralButton
          appearance={ButtonAppearance.Outlined}
          label={t(ButtonsI18nKey.Reset)}
          disabled={!selected.length && !search}
          onClick={onReset}
        />
      </div>
    </div>
  );
};

export default ConversationValueFilter;
