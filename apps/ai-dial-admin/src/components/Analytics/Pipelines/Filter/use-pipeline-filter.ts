'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { translateSqlToQuery } from '@/src/app/[lang]/queries/actions';
import { toFilterRows } from '@/src/components/Analytics/Pipelines/Filter/filter-rows';
import { renderFilterSql } from '@/src/components/Analytics/Pipelines/Filter/filter-sql';
import {
  PipelineFilterMatch,
  PipelineFilterRow,
  PipelineFilterUnavailableReason,
  PipelineFilterView,
} from '@/src/components/Analytics/Pipelines/Filter/models';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';

interface Params {
  filter?: string;
  sourceName?: string;
  /**
   * While the read source or its entity is still resolving, a filter is not read yet rather than reported
   * unreadable: rows written before the column types are known would quote every literal as a string.
   */
  isSourcePending?: boolean;
  /** The source's columns could not be read, so a row's literal cannot be typed and the builder is withheld. */
  hasFieldsError?: boolean;
  fields: AnalyticsEntityField[];
  onChange: (filter?: string) => void;
}

interface Unavailable {
  reason: PipelineFilterUnavailableReason;
  // The text the reason was found for. Once the author edits the SQL, the reason no longer describes it and
  // the builder is offered again.
  text: string;
}

/**
 * The SQL string stays the source of truth: the builder's rows are read from it through the service's own
 * parser and written back to it on every edit, and only an edit writes. Reading a filter on open therefore
 * never changes its text, even where the builder would spell it differently.
 */
export const usePipelineFilter = ({
  filter,
  sourceName,
  isSourcePending,
  hasFieldsError,
  fields,
  onChange,
}: Params) => {
  const text = filter ?? '';
  const [view, setView] = useState<PipelineFilterView>();
  const [rows, setRows] = useState<PipelineFilterRow[]>([]);
  const [match, setMatch] = useState(PipelineFilterMatch.All);
  const [unavailable, setUnavailable] = useState<Unavailable>();
  const [isParsing, setIsParsing] = useState(false);

  // The text the rows were last read from or written to, so a change from anywhere else — discard, the JSON
  // editor — is told apart from the builder's own write.
  const syncedRef = useRef<string | undefined>(undefined);
  const requestRef = useRef(0);

  const showSql = useCallback((reason: PipelineFilterUnavailableReason, forText: string) => {
    setUnavailable({ reason, text: forText });
    setView(PipelineFilterView.Sql);
  }, []);

  const read = useCallback(
    async (next: string) => {
      const request = ++requestRef.current;
      syncedRef.current = next;
      // Each early return settles the field, so it also clears a reading an earlier request left in progress:
      // that request's own `finally` no longer owns the flag once this one has superseded it.
      if (!next.trim()) {
        setIsParsing(false);
        setRows([]);
        setMatch(PipelineFilterMatch.All);
        setUnavailable(undefined);
        setView(PipelineFilterView.Builder);
        return;
      }
      if (!sourceName) {
        setIsParsing(false);
        showSql(PipelineFilterUnavailableReason.NoSource, next);
        return;
      }
      if (hasFieldsError) {
        setIsParsing(false);
        showSql(PipelineFilterUnavailableReason.NoSchema, next);
        return;
      }

      setIsParsing(true);
      try {
        // The probe the service validates a pipeline filter with, so a string it reads here is one it
        // accepts on save.
        const res = await translateSqlToQuery(`SELECT 1 FROM ${sourceName} WHERE ${next}`);
        if (request !== requestRef.current) return;
        if (!res.success || !res.response) {
          showSql(PipelineFilterUnavailableReason.Unparsed, next);
          return;
        }
        const parsed = toFilterRows(res.response.query.filter);
        if (!parsed) {
          showSql(PipelineFilterUnavailableReason.NotFlat, next);
          return;
        }
        setRows(parsed.rows);
        setMatch(parsed.match);
        setUnavailable(undefined);
        setView(PipelineFilterView.Builder);
      } catch {
        if (request === requestRef.current) showSql(PipelineFilterUnavailableReason.Unparsed, next);
      } finally {
        if (request === requestRef.current) setIsParsing(false);
      }
    },
    [sourceName, hasFieldsError, showSql],
  );

  useEffect(() => {
    // The SQL view is edited as text: reading it on every keystroke would cost a request each, and the author
    // asks for the builder explicitly when they want it. A source that resolves late is the one exception.
    const isWaitingForSource = unavailable?.reason === PipelineFilterUnavailableReason.NoSource && !!sourceName;
    if (isSourcePending && text.trim()) return;
    // Until the first read settles the text is edited in place. One request is enough: once it settles, the
    // field rereads a single time if the text has moved on. Emptied text costs no request and settles at once.
    if (view === undefined && isParsing && text.trim()) return;
    if (view === PipelineFilterView.Sql && !isWaitingForSource) return;
    if (view !== undefined && text === syncedRef.current && !isWaitingForSource) return;
    void read(text);
  }, [text, sourceName, isSourcePending, isParsing, view, unavailable?.reason, read]);

  const write = (nextRows: PipelineFilterRow[], nextMatch: PipelineFilterMatch) => {
    // An edit supersedes a read still in flight: its rows describe text the author has already moved past.
    requestRef.current += 1;
    setIsParsing(false);
    setRows(nextRows);
    setMatch(nextMatch);
    const { sql } = renderFilterSql(nextRows, nextMatch, fields);
    syncedRef.current = sql;
    onChange(sql || undefined);
  };

  const onChangeView = (next: PipelineFilterView) => {
    if (next === PipelineFilterView.Sql) {
      setView(PipelineFilterView.Sql);
      return;
    }
    // Back from a look at the SQL with nothing changed: the rows are still the ones written, including any not
    // yet applied, which a reread would drop.
    if (text === syncedRef.current && !unavailable) {
      setView(PipelineFilterView.Builder);
      return;
    }
    void read(text);
  };

  const isBuilderUnavailable = !!unavailable && unavailable.text === text;

  return {
    view,
    rows,
    match,
    isParsing,
    isPending: isParsing || (!!isSourcePending && !!text.trim()),
    unavailableReason: isBuilderUnavailable ? unavailable.reason : undefined,
    skippedCount: renderFilterSql(rows, match, fields).skippedCount,
    onChangeRows: (next: PipelineFilterRow[]) => write(next, match),
    onChangeMatch: (next: PipelineFilterMatch) => write(rows, next),
    onChangeView,
  };
};
