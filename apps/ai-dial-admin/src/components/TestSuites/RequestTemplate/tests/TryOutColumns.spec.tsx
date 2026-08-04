import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { EvaluatedColumn, evaluateColumns } from '@/src/components/TestSuites/utils/evaluate-columns';
import { ResponseColumn } from '@/src/models/evaluation/test-suite';
import TryOutColumns from '../components/TryOutColumns';

vi.mock('@/src/components/TestSuites/utils/evaluate-columns', () => ({
  evaluateColumns: vi.fn(() => Promise.resolve([])),
}));

const makeColumn = (overrides: Partial<ResponseColumn> = {}): ResponseColumn => ({
  name: 'testCol',
  displayName: 'testCol',
  expression: 'foo',
  type: 'STRING',
  ...overrides,
});

const makeEvaluatedColumn = (overrides: Partial<EvaluatedColumn> = {}): EvaluatedColumn => ({
  name: 'testCol',
  expression: 'foo',
  type: 'STRING',
  result: 'bar',
  valid: true,
  ...overrides,
});

describe('TryOutColumns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('evaluates columns against a response body when no request is supplied', async () => {
    const columns = [makeColumn()];
    const response = { foo: 'bar' };
    vi.mocked(evaluateColumns).mockResolvedValueOnce([makeEvaluatedColumn()]);

    render(<TryOutColumns columns={columns} response={response} responseBody={null} />);

    await waitFor(() => {
      expect(screen.getByText('testCol')).toBeInTheDocument();
    });
    expect(evaluateColumns).toHaveBeenCalledWith(columns, response, undefined);
  });

  test('evaluates columns against a request when the response body is empty/absent', async () => {
    const columns = [makeColumn({ expression: '$request.url' })];
    const request = { url: '/v1/chat', method: 'POST' };
    vi.mocked(evaluateColumns).mockResolvedValueOnce([makeEvaluatedColumn({ expression: '$request.url' })]);

    render(<TryOutColumns columns={columns} request={request} responseBody={null} />);

    await waitFor(() => {
      expect(screen.getByText('testCol')).toBeInTheDocument();
    });
    expect(evaluateColumns).toHaveBeenCalledWith(columns, {}, request);
  });

  test('does not evaluate columns and renders no rows when both response and request are absent/empty', async () => {
    const columns = [makeColumn()];

    render(<TryOutColumns columns={columns} response={{}} request={{}} responseBody={null} />);

    await waitFor(() => {
      expect(screen.queryByText('testCol')).not.toBeInTheDocument();
    });
    expect(evaluateColumns).not.toHaveBeenCalled();
  });
});
