'use client';

import { Checkbox } from '@epam/ai-dial-ui-kit';
import { CustomFilterProps, useGridFilter } from 'ag-grid-react';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
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

// Composed here rather than through a translation key: neither part is translatable text, and an
// interpolated key would give every option the same accessible name wherever `t` is a passthrough.
const optionLabel = ({ value, count }: ConversationFieldValue): string =>
  count == null ? value : `${value} (${formatCompactNumber(count)})`;

type Props = CustomFilterProps<ConversationRow, ConversationGridContext, ConversationValueFilterModel>;

/**
 * Lists an enum-typed column's values for selection, with each value's count, in place of a free-text entry.
 *
 * Written rather than configured because `agSetColumnFilter` is an AG Grid Enterprise module and this repo
 * has the community package. AG Grid supplies the popup and the filter lifecycle; this supplies the list.
 */
const ConversationValueFilter: FC<Props> = ({ model, onModelChange, colDef, context }) => {
  const t = useI18n();

  const [state, setState] = useState(ConversationValuesState.Loading);
  const [values, setValues] = useState<ConversationFieldValue[]>([]);
  const [isOpen, setIsOpen] = useState(false);

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

  const onToggleValue = useCallback(
    (value: string, isSelected: boolean) => {
      const next = isSelected ? [...selected, value] : selected.filter((current) => current !== value);
      // A null model deactivates the column's filter — the same state a text entry left blank is in. A model
      // holding an empty list would keep the filter active and narrow by nothing.
      onModelChange(next.length ? { values: next } : null);
    },
    [onModelChange, selected],
  );

  const messageKey = STATE_MESSAGE_KEY[state];

  return (
    <div className="flex min-w-[220px] max-w-[320px] flex-col gap-2 p-3">
      {/* Always mounted so a transition between states is announced rather than only redrawn. */}
      <span
        role="status"
        aria-live="polite"
        className={classNames(
          'text-xs',
          state === ConversationValuesState.LoadFailed ? 'text-error' : 'text-secondary',
        )}
      >
        {messageKey ? t(messageKey) : ''}
      </span>
      {state === ConversationValuesState.Available && (
        <div
          role="group"
          aria-label={t(ConversationsTraceI18nKey.ValueFilterGroup, { column: colDef.headerName ?? fieldName })}
          className="flex max-h-[240px] flex-col gap-2 overflow-y-auto"
        >
          {values.map((fieldValue) => (
            <Checkbox
              key={fieldValue.value}
              labelProps={{ label: optionLabel(fieldValue) }}
              isSelected={selected.includes(fieldValue.value)}
              onChange={(isSelected) => onToggleValue(fieldValue.value, isSelected)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ConversationValueFilter;
