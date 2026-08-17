import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { JSONEditorError } from '@/src/types/editor';
import JSONEditor from '../JsonEditor';

let capturedValue: string | undefined;
let capturedOnChange: (value?: string) => void;
let capturedOnValidate: ((errors?: JSONEditorError[]) => void) | undefined;

vi.mock('@/src/components/Common/JsonEditorBase/JsonEditorBase', () => ({
  default: ({ value, onChange, onValidateJSON }: any) => {
    capturedValue = value;
    capturedOnChange = onChange;
    capturedOnValidate = onValidateJSON;
    return <div role="application" aria-label="json-editor-base" />;
  },
}));

const entity = { id: '1', name: 'Test Entity' };
const mockSetSelectedEntity = vi.fn();
const mockOnChangeText = vi.fn();

describe('JSONEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uncontrolled (default)', () => {
    test('renders JsonEditorBase when model is provided', () => {
      render(<JSONEditor entity={entity} setSelectedEntity={mockSetSelectedEntity} />);

      expect(screen.getByRole('application', { name: 'json-editor-base' })).toBeInTheDocument();
    });

    test('seeds the editor value from the entity', () => {
      render(<JSONEditor entity={entity} setSelectedEntity={mockSetSelectedEntity} />);

      expect(capturedValue).toBe(JSON.stringify(entity, null, 4));
    });

    test('renders nothing if model is not provided', () => {
      // @ts-expect-error purposely omitting model
      const { container } = render(<JSONEditor setSelectedEntity={mockSetSelectedEntity} />);

      expect(container.firstChild).toBeNull();
    });

    test('reseeds the editor value when the entity is replaced externally', () => {
      const { rerender } = render(<JSONEditor entity={entity} setSelectedEntity={mockSetSelectedEntity} />);

      const replaced = { id: '2', name: 'Replaced' };
      rerender(<JSONEditor entity={replaced} setSelectedEntity={mockSetSelectedEntity} />);

      expect(capturedValue).toBe(JSON.stringify(replaced, null, 4));
    });

    test('parses a change and reports the parsed entity', () => {
      render(<JSONEditor entity={entity} setSelectedEntity={mockSetSelectedEntity} />);

      capturedOnChange('{"id":"9"}');

      expect(mockSetSelectedEntity).toHaveBeenCalledWith(expect.objectContaining({ id: '9' }));
    });

    test('ignores a change that does not parse', () => {
      render(<JSONEditor entity={entity} setSelectedEntity={mockSetSelectedEntity} />);

      capturedOnChange('{ not json');

      expect(mockSetSelectedEntity).not.toHaveBeenCalled();
    });
  });

  describe('controlled text buffer', () => {
    test('renders the supplied text instead of the serialized entity', () => {
      render(
        <JSONEditor
          entity={entity}
          setSelectedEntity={mockSetSelectedEntity}
          text="$sum(items.price)"
          onChangeText={mockOnChangeText}
        />,
      );

      expect(capturedValue).toBe('$sum(items.price)');
    });

    test('renders the editor even when the text is empty', () => {
      render(
        <JSONEditor
          entity={entity}
          setSelectedEntity={mockSetSelectedEntity}
          text=""
          onChangeText={mockOnChangeText}
        />,
      );

      expect(screen.getByRole('application', { name: 'json-editor-base' })).toBeInTheDocument();
      expect(capturedValue).toBe('');
    });

    test('does not reseed from the entity when it is replaced externally', () => {
      const { rerender } = render(
        <JSONEditor
          entity={entity}
          setSelectedEntity={mockSetSelectedEntity}
          text="$sum(items.price)"
          onChangeText={mockOnChangeText}
        />,
      );

      rerender(
        <JSONEditor
          entity={{ id: '2', name: 'Replaced' }}
          setSelectedEntity={mockSetSelectedEntity}
          text="$sum(items.price)"
          onChangeText={mockOnChangeText}
        />,
      );

      expect(capturedValue).toBe('$sum(items.price)');
    });

    test('reports every change as text, including text that does not parse', () => {
      render(
        <JSONEditor
          entity={entity}
          setSelectedEntity={mockSetSelectedEntity}
          text="{}"
          onChangeText={mockOnChangeText}
        />,
      );

      capturedOnChange('{ "model": $prompt.model }');

      expect(mockOnChangeText).toHaveBeenCalledWith('{ "model": $prompt.model }');
      expect(mockSetSelectedEntity).not.toHaveBeenCalled();
    });

    test('reports a cleared editor as the empty string', () => {
      render(
        <JSONEditor
          entity={entity}
          setSelectedEntity={mockSetSelectedEntity}
          text="{}"
          onChangeText={mockOnChangeText}
        />,
      );

      capturedOnChange(undefined);

      expect(mockOnChangeText).toHaveBeenCalledWith('');
    });

    test('drops its reported errors when it unmounts, so they cannot block a later save', () => {
      const { dispatch } = useSaveValidationContext();
      const { unmount } = render(
        <JSONEditor
          entity={entity}
          setSelectedEntity={mockSetSelectedEntity}
          text='{ "content": $answer }'
          onChangeText={mockOnChangeText}
        />,
      );

      capturedOnValidate?.([{ message: 'Value expected', startLineNumber: 5 } as JSONEditorError]);
      const reported = vi
        .mocked(dispatch)
        .mock.calls.find(([action]) => action.type === ValidationActionType.SetJsonEditor)?.[0];
      unmount();
      const removed = vi
        .mocked(dispatch)
        .mock.calls.find(([action]) => action.type === ValidationActionType.RemoveJsonEditor)?.[0];

      expect(reported).toEqual(
        expect.objectContaining({ errors: [expect.objectContaining({ message: 'Value expected' })] }),
      );
      expect(removed).toEqual(expect.objectContaining({ editorId: (reported as { editorId: string }).editorId }));
    });

    test('still reports the parsed entity when the text is valid JSON', () => {
      render(
        <JSONEditor
          entity={entity}
          setSelectedEntity={mockSetSelectedEntity}
          text="{}"
          onChangeText={mockOnChangeText}
        />,
      );

      capturedOnChange('{"id":"9"}');

      expect(mockOnChangeText).toHaveBeenCalledWith('{"id":"9"}');
      expect(mockSetSelectedEntity).toHaveBeenCalledWith(expect.objectContaining({ id: '9' }));
    });
  });
});
