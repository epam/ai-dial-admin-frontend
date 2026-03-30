import { act, renderHook } from '@testing-library/react';

import { ComparisonSection } from '../types';
import { useDrawerPanel } from '../useDrawerPanel';
import { useFieldSelector } from '../useFieldSelector';

describe('useDrawerPanel', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useDrawerPanel());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.panelHeight).toBe(380);
    expect(result.current.isCollapsed).toBe(false);
    expect(result.current.viewMode).toBe('table');
    expect(result.current.activeId).toBeNull();
    expect(result.current.pinnedId).toBeNull();
    expect(result.current.currentHeight).toBe(0);
  });

  it('opens with an id and reports currentHeight', () => {
    const { result } = renderHook(() => useDrawerPanel());

    act(() => result.current.open('r1'));

    expect(result.current.isOpen).toBe(true);
    expect(result.current.activeId).toBe('r1');
    expect(result.current.currentHeight).toBe(380);
  });

  it('closes and resets state', () => {
    const { result } = renderHook(() => useDrawerPanel());

    act(() => result.current.open('r1'));
    act(() => result.current.pin('r2'));
    act(() => result.current.close());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.activeId).toBeNull();
    expect(result.current.pinnedId).toBeNull();
    expect(result.current.currentHeight).toBe(0);
  });

  it('collapses and expands', () => {
    const { result } = renderHook(() => useDrawerPanel());

    act(() => result.current.open('r1'));
    act(() => result.current.collapse());

    expect(result.current.isCollapsed).toBe(true);
    expect(result.current.currentHeight).toBe(34);

    act(() => result.current.expand());

    expect(result.current.isCollapsed).toBe(false);
    expect(result.current.currentHeight).toBe(380);
  });

  it('pins and unpins', () => {
    const { result } = renderHook(() => useDrawerPanel());

    act(() => result.current.open('r1'));
    act(() => result.current.pin('r2'));

    expect(result.current.pinnedId).toBe('r2');

    act(() => result.current.unpin());

    expect(result.current.pinnedId).toBeNull();
  });

  it('deduplicates pin when same as active', () => {
    const { result } = renderHook(() => useDrawerPanel());

    act(() => result.current.open('r1'));
    act(() => result.current.pin('r1'));

    expect(result.current.pinnedId).toBeNull();
  });

  it('sets view mode', () => {
    const { result } = renderHook(() => useDrawerPanel());

    act(() => result.current.setView('pivot'));

    expect(result.current.viewMode).toBe('pivot');
  });

  it('clearPinIfMissing clears when id not in list', () => {
    const { result } = renderHook(() => useDrawerPanel());

    act(() => result.current.open('r1'));
    act(() => result.current.pin('r2'));
    act(() => result.current.clearPinIfMissing(['r1', 'r3']));

    expect(result.current.pinnedId).toBeNull();
  });

  it('clearPinIfMissing keeps when id in list', () => {
    const { result } = renderHook(() => useDrawerPanel());

    act(() => result.current.open('r1'));
    act(() => result.current.pin('r2'));
    act(() => result.current.clearPinIfMissing(['r1', 'r2']));

    expect(result.current.pinnedId).toBe('r2');
  });

  it('clamps height on window resize', () => {
    const { result } = renderHook(() => useDrawerPanel());

    act(() => result.current.open('r1'));
    act(() => result.current.setPanelHeight(800));

    // Simulate a small viewport
    Object.defineProperty(window, 'innerHeight', { value: 400, writable: true });
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    // Max = 400 - 100 = 300
    expect(result.current.panelHeight).toBeLessThanOrEqual(300);
  });
});

describe('useFieldSelector', () => {
  const mockSections: ComparisonSection[] = [
    {
      key: 'execution',
      label: 'Execution',
      rows: [
        { fieldKey: 'status', label: 'status', isNumeric: false, values: [{ raw: 'SUCCESS', display: null }] },
        { fieldKey: 'duration', label: 'duration', isNumeric: true, values: [{ raw: '1000', display: null }] },
      ],
    },
    {
      key: 'testCaseData',
      label: 'Test Case Data',
      rows: [{ fieldKey: 'input', label: 'input', isNumeric: false, values: [{ raw: 'hello', display: null }] }],
    },
  ];

  it('initializes with all fields visible', () => {
    const { result } = renderHook(() => useFieldSelector(mockSections));

    expect(result.current.allFieldsHidden).toBe(false);
    expect(result.current.fieldVisibility).toEqual({});
  });

  it('toggles field visibility', () => {
    const { result } = renderHook(() => useFieldSelector(mockSections));

    act(() => result.current.toggleField('execution:status'));

    expect(result.current.fieldVisibility['execution:status']).toBe(false);

    act(() => result.current.toggleField('execution:status'));

    expect(result.current.fieldVisibility['execution:status']).toBe(true);
  });

  it('selectAll and deselectAll in section', () => {
    const { result } = renderHook(() => useFieldSelector(mockSections));

    act(() => result.current.deselectAllInSection('execution', ['status', 'duration']));

    expect(result.current.fieldVisibility['execution:status']).toBe(false);
    expect(result.current.fieldVisibility['execution:duration']).toBe(false);

    act(() => result.current.selectAllInSection('execution', ['status', 'duration']));

    expect(result.current.fieldVisibility['execution:status']).toBe(true);
    expect(result.current.fieldVisibility['execution:duration']).toBe(true);
  });

  it('filters sections by search query', () => {
    const { result } = renderHook(() => useFieldSelector(mockSections));

    act(() => result.current.setSearchQuery('input'));

    expect(result.current.filteredSections).toHaveLength(1);
    expect(result.current.filteredSections[0].key).toBe('testCaseData');
  });

  it('search is case-insensitive', () => {
    const { result } = renderHook(() => useFieldSelector(mockSections));

    act(() => result.current.setSearchQuery('STATUS'));

    expect(result.current.filteredSections).toHaveLength(1);
    expect(result.current.filteredSections[0].key).toBe('execution');
  });

  it('toggles spotlight', () => {
    const { result } = renderHook(() => useFieldSelector(mockSections));

    act(() => result.current.toggleSpotlight('execution:status'));

    expect(result.current.spotlightedFields.has('execution:status')).toBe(true);

    act(() => result.current.toggleSpotlight('execution:status'));

    expect(result.current.spotlightedFields.has('execution:status')).toBe(false);
  });

  it('toggles section hidden', () => {
    const { result } = renderHook(() => useFieldSelector(mockSections));

    act(() => result.current.toggleSectionHidden('execution'));

    expect(result.current.sectionHidden['execution']).toBe(true);
  });

  it('moves section by keyboard', () => {
    const { result } = renderHook(() => useFieldSelector(mockSections));

    act(() => result.current.initOrder(['execution', 'testCaseData']));

    act(() => result.current.moveSectionByKeyboard('execution', 'down'));

    expect(result.current.sectionOrder).toEqual(['testCaseData', 'execution']);
  });

  it('resetAll clears all state', () => {
    const { result } = renderHook(() => useFieldSelector(mockSections));

    act(() => result.current.toggleField('execution:status'));
    act(() => result.current.toggleSpotlight('execution:status'));
    act(() => result.current.setSearchQuery('test'));
    act(() => result.current.toggleSectionHidden('execution'));

    act(() => result.current.resetAll(['execution', 'testCaseData']));

    expect(result.current.fieldVisibility).toEqual({});
    expect(result.current.spotlightedFields.size).toBe(0);
    expect(result.current.searchQuery).toBe('');
    expect(result.current.sectionHidden).toEqual({});
  });

  it('allFieldsHidden returns true when all fields are hidden', () => {
    const { result } = renderHook(() => useFieldSelector(mockSections));

    act(() => {
      result.current.deselectAllInSection('execution', ['status', 'duration']);
      result.current.deselectAllInSection('testCaseData', ['input']);
    });

    expect(result.current.allFieldsHidden).toBe(true);
  });
});
