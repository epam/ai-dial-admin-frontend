import { render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import JsonataEditor from '../JsonataEditor';
import {
  JSONATA_FUNCTIONS,
  JSONATA_KEYWORDS,
  JSONATA_LANGUAGE_CONFIGURATION,
  JSONATA_LANGUAGE_ID,
  JSONATA_MONARCH_TOKENS,
} from '../constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capturedProps: any;

vi.mock('@/src/components/Common/JsonEditorBase/JsonEditorBase', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => {
    capturedProps = props;
    return <div role="textbox" aria-label="jsonata-editor-base" />;
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildCompletionMonaco = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let capturedProvider: any;
  const monaco = {
    languages: {
      registerCompletionItemProvider: vi.fn((_id: string, provider: unknown) => {
        capturedProvider = provider;
        return { dispose: vi.fn() };
      }),
      CompletionItemKind: { Function: 1, Keyword: 2, Variable: 3 },
    },
  };
  return { monaco, getProvider: () => capturedProvider };
};

describe('JsonataEditor', () => {
  beforeEach(() => {
    capturedProps = undefined;
  });

  test('renders JsonEditorBase with the jsonata language', () => {
    render(<JsonataEditor value="$sum(x)" onChange={vi.fn()} />);

    expect(capturedProps.language).toBe(JSONATA_LANGUAGE_ID);
  });

  test('passes the value through unchanged', () => {
    render(<JsonataEditor value="$sum(items.price)" onChange={vi.fn()} />);

    expect(capturedProps.value).toBe('$sum(items.price)');
  });

  test('emits an empty string when Monaco reports undefined', () => {
    const onChange = vi.fn();
    render(<JsonataEditor value="" onChange={onChange} />);

    capturedProps.onChange(undefined);

    expect(onChange).toHaveBeenCalledWith('');
  });

  describe('language registration (onBeforeMount)', () => {
    test('is a no-op when jsonata is already registered', () => {
      render(<JsonataEditor value="" onChange={vi.fn()} />);

      const monaco = {
        languages: {
          getLanguages: vi.fn(() => [{ id: JSONATA_LANGUAGE_ID }]),
          register: vi.fn(),
          setMonarchTokensProvider: vi.fn(),
          setLanguageConfiguration: vi.fn(),
        },
      };

      capturedProps.onBeforeMount(monaco);

      expect(monaco.languages.register).not.toHaveBeenCalled();
      expect(monaco.languages.setMonarchTokensProvider).not.toHaveBeenCalled();
      expect(monaco.languages.setLanguageConfiguration).not.toHaveBeenCalled();
    });

    test('registers the language, tokenizer, and configuration when not already registered', () => {
      render(<JsonataEditor value="" onChange={vi.fn()} />);

      const monaco = {
        languages: {
          getLanguages: vi.fn(() => []),
          register: vi.fn(),
          setMonarchTokensProvider: vi.fn(),
          setLanguageConfiguration: vi.fn(),
        },
      };

      capturedProps.onBeforeMount(monaco);

      expect(monaco.languages.register).toHaveBeenCalledWith({ id: JSONATA_LANGUAGE_ID });
      expect(monaco.languages.setMonarchTokensProvider).toHaveBeenCalledWith(
        JSONATA_LANGUAGE_ID,
        JSONATA_MONARCH_TOKENS,
      );
      expect(monaco.languages.setLanguageConfiguration).toHaveBeenCalledWith(
        JSONATA_LANGUAGE_ID,
        JSONATA_LANGUAGE_CONFIGURATION,
      );
    });
  });

  describe('completion provider', () => {
    test('triggerCharacters includes $', () => {
      render(<JsonataEditor value="" onChange={vi.fn()} />);
      const { monaco, getProvider } = buildCompletionMonaco();
      const editorInstance = { getModel: () => ({ id: 'model-1' }), onDidDispose: vi.fn() };

      capturedProps.onEditorMount(editorInstance, monaco);

      expect(getProvider().triggerCharacters).toContain('$');
    });

    test('returns no suggestions for a foreign model', () => {
      render(<JsonataEditor value="" onChange={vi.fn()} />);
      const { monaco, getProvider } = buildCompletionMonaco();
      const editorInstance = { getModel: () => ({ id: 'model-1' }), onDidDispose: vi.fn() };
      capturedProps.onEditorMount(editorInstance, monaco);

      const foreignModel = {
        id: 'other-model',
        getWordUntilPosition: vi.fn(),
        getValueInRange: vi.fn(),
      };

      const result = getProvider().provideCompletionItems(foreignModel, { lineNumber: 1, column: 1 });

      expect(result.suggestions).toEqual([]);
    });

    test('returns builtin functions and keywords for its own model', () => {
      render(<JsonataEditor value="" onChange={vi.fn()} />);
      const { monaco, getProvider } = buildCompletionMonaco();
      const editorInstance = { getModel: () => ({ id: 'model-1' }), onDidDispose: vi.fn() };
      capturedProps.onEditorMount(editorInstance, monaco);

      const ownModel = {
        id: 'model-1',
        getWordUntilPosition: vi.fn(() => ({ word: '', startColumn: 1, endColumn: 1 })),
        getValueInRange: vi.fn(() => ''),
      };

      const result = getProvider().provideCompletionItems(ownModel, { lineNumber: 1, column: 1 });

      expect(result.suggestions).toHaveLength(JSONATA_FUNCTIONS.length + JSONATA_KEYWORDS.length);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sumSuggestion = result.suggestions.find((s: any) => s.label === '$sum');
      expect(sumSuggestion?.detail).toBe('$sum(array)');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(result.suggestions.some((s: any) => s.label === 'function')).toBe(true);
    });

    test('anchors the replace range one column left when the preceding character is $', () => {
      render(<JsonataEditor value="" onChange={vi.fn()} />);
      const { monaco, getProvider } = buildCompletionMonaco();
      const editorInstance = { getModel: () => ({ id: 'model-1' }), onDidDispose: vi.fn() };
      capturedProps.onEditorMount(editorInstance, monaco);

      const ownModel = {
        id: 'model-1',
        getWordUntilPosition: vi.fn(() => ({ word: 'su', startColumn: 2, endColumn: 4 })),
        getValueInRange: vi.fn(() => '$'),
      };

      const result = getProvider().provideCompletionItems(ownModel, { lineNumber: 1, column: 4 });
      const range = result.suggestions[0].range;

      expect(range.startColumn).toBe(1);

      const line = '$su';
      const before = line.slice(0, range.startColumn - 1);
      const after = line.slice(range.endColumn - 1);
      const applied = `${before}$sum${after}`;

      expect(applied).toBe('$sum');
      expect(applied.match(/\$/g)).toHaveLength(1);
    });

    test('offers the given variables ahead of the builtins, prefixed with a dollar sign', () => {
      render(
        <JsonataEditor
          value=""
          onChange={vi.fn()}
          variables={[{ name: 'answer', description: 'Output of 1. Main request' }]}
        />,
      );
      const { monaco, getProvider } = buildCompletionMonaco();
      const editorInstance = { getModel: () => ({ id: 'model-1' }), onDidDispose: vi.fn() };
      capturedProps.onEditorMount(editorInstance, monaco);

      const ownModel = {
        id: 'model-1',
        getWordUntilPosition: vi.fn(() => ({ word: '', startColumn: 1, endColumn: 1 })),
        getValueInRange: vi.fn(() => ''),
      };

      const result = getProvider().provideCompletionItems(ownModel, { lineNumber: 1, column: 1 });

      expect(result.suggestions).toHaveLength(JSONATA_FUNCTIONS.length + JSONATA_KEYWORDS.length + 1);
      expect(result.suggestions[0]).toMatchObject({
        label: '$answer',
        insertText: '$answer',
        kind: 3,
        detail: 'Output of 1. Main request',
      });
      expect(result.suggestions[0].sortText < '$sum').toBe(true);
    });

    test('offers only the builtins when no variables are given', () => {
      render(<JsonataEditor value="" onChange={vi.fn()} />);
      const { monaco, getProvider } = buildCompletionMonaco();
      const editorInstance = { getModel: () => ({ id: 'model-1' }), onDidDispose: vi.fn() };
      capturedProps.onEditorMount(editorInstance, monaco);

      const ownModel = {
        id: 'model-1',
        getWordUntilPosition: vi.fn(() => ({ word: '', startColumn: 1, endColumn: 1 })),
        getValueInRange: vi.fn(() => ''),
      };

      const result = getProvider().provideCompletionItems(ownModel, { lineNumber: 1, column: 1 });

      expect(result.suggestions).toHaveLength(JSONATA_FUNCTIONS.length + JSONATA_KEYWORDS.length);
    });

    test('picks up variables added after the provider was registered', () => {
      const { rerender } = render(<JsonataEditor value="" onChange={vi.fn()} />);
      const { monaco, getProvider } = buildCompletionMonaco();
      const editorInstance = { getModel: () => ({ id: 'model-1' }), onDidDispose: vi.fn() };
      capturedProps.onEditorMount(editorInstance, monaco);

      rerender(<JsonataEditor value="" onChange={vi.fn()} variables={[{ name: 'answer' }]} />);

      const ownModel = {
        id: 'model-1',
        getWordUntilPosition: vi.fn(() => ({ word: '', startColumn: 1, endColumn: 1 })),
        getValueInRange: vi.fn(() => ''),
      };

      const result = getProvider().provideCompletionItems(ownModel, { lineNumber: 1, column: 1 });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(result.suggestions.some((s: any) => s.label === '$answer')).toBe(true);
    });

    test('disposes the completion provider on unmount', () => {
      const { unmount } = render(<JsonataEditor value="" onChange={vi.fn()} />);
      const dispose = vi.fn();
      const monaco = {
        languages: {
          registerCompletionItemProvider: vi.fn(() => ({ dispose })),
          CompletionItemKind: { Function: 1, Keyword: 2 },
        },
      };
      const editorInstance = { getModel: () => ({ id: 'model-1' }), onDidDispose: vi.fn() };
      capturedProps.onEditorMount(editorInstance, monaco);

      unmount();

      expect(dispose).toHaveBeenCalled();
    });
  });
});
