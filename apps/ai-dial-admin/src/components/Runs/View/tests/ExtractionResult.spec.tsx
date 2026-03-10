import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getRunResults } from '@/src/app/[lang]/runs/actions';
import { EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { RESULT_FILTERS, getResultColumns } from '../utils';
import ExtractionResultTab from '../ExtractionResult';

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getRunResults: vi.fn(),
}));

vi.mock('../utils', () => ({
  RESULT_FILTERS: vi.fn(() => [{ column: 'runId', operator: 'eq', value: 'run-1' }]),
  getResultColumns: vi.fn((results: unknown[]) => [{ field: `col-${results.length}` }]),
}));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData, columnDefs, emptyDataProps }: any) => (
    <section aria-label="grid-view">
      <p>rows:{Array.isArray(rowData) ? rowData.length : 'null'}</p>
      <p>columns:{Array.isArray(columnDefs) ? columnDefs.length : 0}</p>
      <p>empty-title:{emptyDataProps?.title}</p>
    </section>
  ),
}));

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

describe('Runs View :: ExtractionResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders heading and does not fetch when run id is missing', () => {
    render(<ExtractionResultTab run={{}} />);

    expect(screen.getByRole('heading', { name: TabsI18nKey.ExtractionResult })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'grid-view' })).toBeInTheDocument();
    expect(screen.getByText(`empty-title:${EntitiesI18nKey.NoResults}`)).toBeInTheDocument();
    expect(getRunResults).not.toHaveBeenCalled();
  });

  test('fetches run results, shows loader, then renders grid data', async () => {
    const deferred = createDeferred<{ content: Array<{ id: string }> }>();
    (getRunResults as any).mockReturnValueOnce(deferred.promise);

    render(<ExtractionResultTab run={{ id: 'run-1', testSuiteId: 'suite-1' }} />);

    await waitFor(() => {
      expect(RESULT_FILTERS).toHaveBeenCalledWith(expect.objectContaining({ id: 'run-1' }));
      expect(getRunResults).toHaveBeenCalledWith([{ column: 'runId', operator: 'eq', value: 'run-1' }]);
    });

    expect(screen.getByRole('status')).toBeInTheDocument();

    deferred.resolve({ content: [{ id: 'result-1' }] });

    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'grid-view' })).toHaveTextContent('rows:1');
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(getResultColumns).toHaveBeenCalledWith([{ id: 'result-1' }]);
  });

  test('falls back to empty array when response content is missing', async () => {
    (getRunResults as any).mockResolvedValueOnce({});

    render(<ExtractionResultTab run={{ id: 'run-2', testSuiteId: 'suite-2' }} />);

    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'grid-view' })).toHaveTextContent('rows:0');
    });

    expect(getResultColumns).toHaveBeenCalledWith([]);
  });
});
