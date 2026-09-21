import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { CatalogSchemaDocument } from '@/src/models/dial/catalog-schema';
import { useCatalogProperties } from '../use-catalog-properties';

const dispatch = vi.fn();

// The global mock in `test-setup.tsx` hands out a fresh `vi.fn()` per call, so the dispatch a
// component made is unobservable through it — this spec needs its own.
vi.mock('@/src/context/SaveValidationContext', () => ({
  useSaveValidationContext: () => ({ isValid: true, dispatch }),
  ValidationActionType: { SetField: 'SET_FIELD_VALIDATION', RemoveField: 'REMOVE_FIELD_VALIDATION' },
}));

const getCatalogSchemaById = vi.fn();

vi.mock('@/src/app/[lang]/platform-catalog-schemas/actions', () => ({
  getCatalogSchemaById: (id: string) => getCatalogSchemaById(id),
}));

const AGENT_ID = 'https://host/agent-card';
const MODEL_ID = 'https://host/model-card';

const agentSchema: CatalogSchemaDocument = {
  $id: AGENT_ID,
  required: ['tag'],
  properties: { tag: { type: 'string', enum: ['Featured', 'New'] } },
};

const modelSchema: CatalogSchemaDocument = {
  $id: MODEL_ID,
  required: ['rank'],
  properties: { rank: { type: 'integer' } },
};

const validityOf = (calls: unknown[][]) =>
  calls
    .map(([action]) => action as { field?: string; isValid?: boolean })
    .filter((action) => action.field === 'catalogProperties')
    .map((action) => action.isValid);

describe('useCatalogProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCatalogSchemaById.mockImplementation((id: string) =>
      Promise.resolve({ success: true, response: id === AGENT_ID ? agentSchema : modelSchema }),
    );
  });

  test('reports values matching the schema as valid', async () => {
    renderHook(() => useCatalogProperties(AGENT_ID, { tag: 'New' }));

    await waitFor(() => expect(validityOf(dispatch.mock.calls)).toContain(true));
    expect(validityOf(dispatch.mock.calls)).not.toContain(false);
  });

  /** The gate this hook exists for: the editor renders only on its own tab, the save does not. */
  test('blocks the save for stored values that violate the schema, with no editor ever rendered', async () => {
    const { result } = renderHook(() => useCatalogProperties(AGENT_ID, { tag: 'Retired' }));

    await waitFor(() => expect(validityOf(dispatch.mock.calls)).toContain(false));
    expect(result.current.errors.map((error) => error.field)).toEqual(['tag']);
  });

  test('blocks the save for a required value left empty', async () => {
    renderHook(() => useCatalogProperties(AGENT_ID, {}));

    await waitFor(() => expect(validityOf(dispatch.mock.calls)).toContain(false));
  });

  test('re-validates against the new schema when the selection changes on another tab', async () => {
    const { result, rerender } = renderHook(({ id }) => useCatalogProperties(id, { tag: 'New' }), {
      initialProps: { id: AGENT_ID },
    });

    await waitFor(() => expect(result.current.errors).toEqual([]));

    rerender({ id: MODEL_ID });

    await waitFor(() => expect(result.current.errors.map((error) => error.field)).toEqual(['rank']));
    expect(validityOf(dispatch.mock.calls)).toContain(false);
  });

  test('reports no schema selected as valid, so an unrelated save is not blocked', async () => {
    renderHook(() => useCatalogProperties(undefined, undefined));

    await waitFor(() => expect(validityOf(dispatch.mock.calls)).toContain(true));
    expect(getCatalogSchemaById).not.toHaveBeenCalled();
  });

  test('reports a failed schema read rather than guessing at validity', async () => {
    getCatalogSchemaById.mockResolvedValue({ success: false, errorMessage: 'nope' });

    const { result } = renderHook(() => useCatalogProperties(AGENT_ID, { tag: 'Retired' }));

    await waitFor(() => expect(result.current.hasReadFailed).toBe(true));
    expect(result.current.schema).toBeUndefined();
    expect(validityOf(dispatch.mock.calls)).toContain(true);
  });

  test('resolves the schema by its own id', async () => {
    renderHook(() => useCatalogProperties(AGENT_ID, {}));

    await waitFor(() => expect(getCatalogSchemaById).toHaveBeenCalledWith(AGENT_ID));
  });
});
