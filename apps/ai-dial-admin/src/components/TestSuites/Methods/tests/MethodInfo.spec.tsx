import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import MethodInfo from '../MethodInfo';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => ({
  ...((await importOriginal()) as object),
  DialInput: ({ value, onChange, error, invalid }: any) => (
    <div>
      <input
        aria-label="Final path"
        aria-invalid={!!invalid}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <span role="alert">{error}</span> : null}
    </div>
  ),
  DialNoDataContent: ({ title }: any) => <div>{title}</div>,
}));

vi.mock('@/src/components/Common/ViewSelector/ViewSelector', () => ({ __esModule: true, default: () => null }));
vi.mock('@/src/components/Common/ViewSelector/TableView', () => ({ __esModule: true, default: () => null }));
vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({ __esModule: true, default: () => null }));
vi.mock('../Endpoint', () => ({ __esModule: true, default: () => null }));

const suite = (relativeUrlPattern: string, urlTemplate: string): TestSuite =>
  ({
    endpointRef: { method: 'POST', relativeUrlPattern },
    requestTemplate: { urlTemplate },
  }) as TestSuite;

describe('MethodInfo final-path validation', () => {
  const { dispatch } = useSaveValidationContext();

  beforeEach(() => {
    vi.mocked(dispatch).mockClear();
  });

  test('reports no error for a path matching the regex pattern', () => {
    render(
      <MethodInfo
        testSuite={suite('/openai/v1/responses/[^/]+', '/openai/v1/responses/resp_1')}
        onChangeTestSuite={vi.fn()}
      />,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ field: 'urlTemplate', isValid: true }));
  });

  test('reports an error for a path the pattern rejects', () => {
    render(
      <MethodInfo
        testSuite={suite('/openai/v1/responses/[^/]+/cancel', '/openai/v1/responses/resp_1')}
        onChangeTestSuite={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Not matches with /openai/v1/responses/[^/]+/cancel regex');
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ field: 'urlTemplate', isValid: false }));
  });

  test('clears a standing error once the method changes', () => {
    const { rerender } = render(
      <MethodInfo
        testSuite={suite('/openai/v1/responses/[^/]+/cancel', '/openai/v1/responses/resp_1')}
        onChangeTestSuite={vi.fn()}
      />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(
      <MethodInfo testSuite={suite('/openai/v1/responses', '/openai/v1/responses')} onChangeTestSuite={vi.fn()} />,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(dispatch).toHaveBeenLastCalledWith(expect.objectContaining({ field: 'urlTemplate', isValid: true }));
  });

  test('skips validation for a pattern carrying no regex symbols', () => {
    render(<MethodInfo testSuite={suite('/chat/completions', '/anything')} onChangeTestSuite={vi.fn()} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
