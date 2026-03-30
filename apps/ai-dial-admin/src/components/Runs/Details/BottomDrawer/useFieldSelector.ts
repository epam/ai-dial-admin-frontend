'use client';

import { useCallback, useMemo, useReducer, useState } from 'react';

import { ComparisonSection } from './types';

type VisibilityAction =
  | { type: 'toggle'; key: string }
  | { type: 'selectAll'; sectionKey: string; fieldKeys: string[] }
  | { type: 'deselectAll'; sectionKey: string; fieldKeys: string[] }
  | { type: 'reset' };

function visibilityReducer(state: Record<string, boolean>, action: VisibilityAction): Record<string, boolean> {
  switch (action.type) {
    case 'toggle': {
      const current = state[action.key] !== false;
      return { ...state, [action.key]: !current };
    }
    case 'selectAll': {
      const next = { ...state };
      for (const fk of action.fieldKeys) {
        next[`${action.sectionKey}:${fk}`] = true;
      }
      return next;
    }
    case 'deselectAll': {
      const next = { ...state };
      for (const fk of action.fieldKeys) {
        next[`${action.sectionKey}:${fk}`] = false;
      }
      return next;
    }
    case 'reset':
      return {};
  }
}

type OrderAction =
  | { type: 'reorder'; order: string[] }
  | { type: 'move'; sectionKey: string; direction: 'up' | 'down' }
  | { type: 'reset'; defaultOrder: string[] };

function orderReducer(state: string[], action: OrderAction): string[] {
  switch (action.type) {
    case 'reorder':
      return action.order;
    case 'move': {
      const idx = state.indexOf(action.sectionKey);
      if (idx === -1) return state;
      const newIdx = action.direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= state.length) return state;
      const next = [...state];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    }
    case 'reset':
      return action.defaultOrder;
  }
}

interface UseFieldSelectorReturn {
  fieldVisibility: Record<string, boolean>;
  sectionOrder: string[];
  sectionHidden: Record<string, boolean>;
  spotlightedFields: Set<string>;
  searchQuery: string;
  allFieldsHidden: boolean;
  filteredSections: ComparisonSection[];
  toggleField: (key: string) => void;
  toggleSectionHidden: (sectionKey: string) => void;
  selectAllInSection: (sectionKey: string, fieldKeys: string[]) => void;
  deselectAllInSection: (sectionKey: string, fieldKeys: string[]) => void;
  setSearchQuery: (query: string) => void;
  reorderSections: (order: string[]) => void;
  moveSectionByKeyboard: (sectionKey: string, direction: 'up' | 'down') => void;
  toggleSpotlight: (fieldKey: string) => void;
  resetAll: (defaultOrder?: string[]) => void;
  initOrder: (defaultOrder: string[]) => void;
}

export function useFieldSelector(sections: ComparisonSection[]): UseFieldSelectorReturn {
  const [fieldVisibility, dispatchVisibility] = useReducer(visibilityReducer, {});
  const [sectionOrder, dispatchOrder] = useReducer(
    orderReducer,
    sections.map((s) => s.key),
  );
  const [sectionHidden, setSectionHidden] = useState<Record<string, boolean>>({});
  const [spotlightedFields, setSpotlightedFields] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleField = useCallback((key: string) => {
    dispatchVisibility({ type: 'toggle', key });
  }, []);

  const toggleSectionHidden = useCallback((sectionKey: string) => {
    setSectionHidden((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  }, []);

  const selectAllInSection = useCallback((sectionKey: string, fieldKeys: string[]) => {
    dispatchVisibility({ type: 'selectAll', sectionKey, fieldKeys });
  }, []);

  const deselectAllInSection = useCallback((sectionKey: string, fieldKeys: string[]) => {
    dispatchVisibility({ type: 'deselectAll', sectionKey, fieldKeys });
  }, []);

  const reorderSections = useCallback((order: string[]) => {
    dispatchOrder({ type: 'reorder', order });
  }, []);

  const moveSectionByKeyboard = useCallback((sectionKey: string, direction: 'up' | 'down') => {
    dispatchOrder({ type: 'move', sectionKey, direction });
  }, []);

  const toggleSpotlight = useCallback((fieldKey: string) => {
    setSpotlightedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldKey)) {
        next.delete(fieldKey);
      } else {
        next.add(fieldKey);
      }
      return next;
    });
  }, []);

  const resetAll = useCallback((defaultOrder?: string[]) => {
    dispatchVisibility({ type: 'reset' });
    if (defaultOrder) {
      dispatchOrder({ type: 'reset', defaultOrder });
    }
    setSectionHidden({});
    setSpotlightedFields(new Set());
    setSearchQuery('');
  }, []);

  const initOrder = useCallback((defaultOrder: string[]) => {
    dispatchOrder({ type: 'reset', defaultOrder });
  }, []);

  const allFieldsHidden = useMemo(() => {
    for (const section of sections) {
      if (sectionHidden[section.key]) continue;
      for (const row of section.rows) {
        const visKey = `${section.key}:${row.fieldKey}`;
        if (fieldVisibility[visKey] !== false) return false;
      }
    }
    return true;
  }, [sections, sectionHidden, fieldVisibility]);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        rows: section.rows.filter((row) => row.label.toLowerCase().includes(q)),
      }))
      .filter((section) => section.rows.length > 0);
  }, [sections, searchQuery]);

  return {
    fieldVisibility,
    sectionOrder,
    sectionHidden,
    spotlightedFields,
    searchQuery,
    allFieldsHidden,
    filteredSections,
    toggleField,
    toggleSectionHidden,
    selectAllInSection,
    deselectAllInSection,
    setSearchQuery,
    reorderSections,
    moveSectionByKeyboard,
    toggleSpotlight,
    resetAll,
    initOrder,
  };
}
