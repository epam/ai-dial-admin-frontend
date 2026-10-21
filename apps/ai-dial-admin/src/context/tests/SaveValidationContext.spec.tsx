import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FC } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { JSONEditorError } from '@/src/types/editor';

const {
  SaveValidationContextProvider,
  useSaveValidationContext,
  ValidationActionType,
}: typeof import('@/src/context/SaveValidationContext') = await vi.importActual('@/src/context/SaveValidationContext');

const makeError = (message: string, startLineNumber = 1): JSONEditorError =>
  ({ message, startLineNumber }) as JSONEditorError;

interface HarnessProps {
  editorId: string;
  errors: JSONEditorError[];
}

const ErrorReporter: FC<HarnessProps> = ({ editorId, errors }) => {
  const { dispatch } = useSaveValidationContext();

  return (
    <>
      <button onClick={() => dispatch({ type: ValidationActionType.SetJsonEditor, editorId, errors })}>
        {`report-${editorId}`}
      </button>
      <button onClick={() => dispatch({ type: ValidationActionType.RemoveJsonEditor, editorId })}>
        {`remove-${editorId}`}
      </button>
      <button onClick={() => dispatch({ type: ValidationActionType.Reset })}>reset</button>
    </>
  );
};

const ErrorList: FC = () => {
  const { jsonErrors } = useSaveValidationContext();

  return <output>{jsonErrors.map((error) => error.message).join('|')}</output>;
};

const NullReporter: FC = () => {
  const { dispatch } = useSaveValidationContext();

  return (
    <button onClick={() => dispatch({ type: ValidationActionType.SetJsonEditor, editorId: 'null', errors: null })}>
      report-null
    </button>
  );
};

const renderHarness = (editors: HarnessProps[]) =>
  render(
    <SaveValidationContextProvider>
      {editors.map((editor) => (
        <ErrorReporter key={editor.editorId} {...editor} />
      ))}
      <ErrorList />
    </SaveValidationContextProvider>,
  );

const reportedErrors = () => screen.getByRole('status').textContent;

describe('SaveValidationContext', () => {
  test('exposes no json errors before any editor reports', () => {
    renderHarness([{ editorId: 'a', errors: [makeError('Value expected')] }]);

    expect(reportedErrors()).toBe('');
  });

  test('exposes the errors an editor reports', async () => {
    const user = userEvent.setup();
    renderHarness([{ editorId: 'a', errors: [makeError('Value expected')] }]);

    await user.click(screen.getByRole('button', { name: 'report-a' }));

    expect(reportedErrors()).toBe('Value expected');
  });

  test('keeps each editor errors separate instead of overwriting the previous editor', async () => {
    const user = userEvent.setup();
    renderHarness([
      { editorId: 'a', errors: [makeError('Value expected')] },
      { editorId: 'b', errors: [makeError('Colon expected')] },
    ]);

    await user.click(screen.getByRole('button', { name: 'report-a' }));
    await user.click(screen.getByRole('button', { name: 'report-b' }));

    expect(reportedErrors()).toBe('Value expected|Colon expected');
  });

  test('drops only the removed editor errors', async () => {
    const user = userEvent.setup();
    renderHarness([
      { editorId: 'a', errors: [makeError('Value expected')] },
      { editorId: 'b', errors: [makeError('Colon expected')] },
    ]);

    await user.click(screen.getByRole('button', { name: 'report-a' }));
    await user.click(screen.getByRole('button', { name: 'report-b' }));
    await user.click(screen.getByRole('button', { name: 'remove-a' }));

    expect(reportedErrors()).toBe('Colon expected');
  });

  test('ignores removal of an editor that never reported', async () => {
    const user = userEvent.setup();
    renderHarness([
      { editorId: 'a', errors: [makeError('Value expected')] },
      { editorId: 'b', errors: [] },
    ]);

    await user.click(screen.getByRole('button', { name: 'report-a' }));
    await user.click(screen.getByRole('button', { name: 'remove-b' }));

    expect(reportedErrors()).toBe('Value expected');
  });

  test('treats a null error list as no errors for that editor', async () => {
    const user = userEvent.setup();
    render(
      <SaveValidationContextProvider>
        <NullReporter />
        <ErrorList />
      </SaveValidationContextProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'report-null' }));

    expect(reportedErrors()).toBe('');
  });

  test('clears every editor errors on reset', async () => {
    const user = userEvent.setup();
    renderHarness([{ editorId: 'a', errors: [makeError('Value expected')] }]);

    await user.click(screen.getByRole('button', { name: 'report-a' }));
    await user.click(screen.getByRole('button', { name: 'reset' }));

    expect(reportedErrors()).toBe('');
  });
});
