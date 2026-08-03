import { render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { EDITOR_THEMES_CONFIG } from '@/src/constants/editor';
import JsonEditorBase from '../JsonEditorBase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capturedEditorProps: any;

vi.mock('@monaco-editor/react', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Editor: (props: any) => {
    capturedEditorProps = props;
    return <div role="textbox" aria-label="monaco-editor-mock" />;
  },
}));

vi.mock('@/src/context/ThemeContext', () => ({
  useTheme: () => ({ currentTheme: 'dark' }),
}));

const buildMonaco = () => ({
  editor: { defineTheme: vi.fn() },
  languages: { json: { jsonDefaults: { setDiagnosticsOptions: vi.fn() } } },
});

describe('JsonEditorBase', () => {
  beforeEach(() => {
    capturedEditorProps = undefined;
  });

  test('invokes onBeforeMount with the Monaco instance', () => {
    const onBeforeMount = vi.fn();
    render(<JsonEditorBase value="{}" onChange={vi.fn()} onBeforeMount={onBeforeMount} />);

    const monaco = buildMonaco();
    capturedEditorProps.beforeMount(monaco);

    expect(onBeforeMount).toHaveBeenCalledWith(monaco);
  });

  test('still defines the current theme when onBeforeMount is supplied', () => {
    render(<JsonEditorBase value="{}" onChange={vi.fn()} onBeforeMount={vi.fn()} />);

    const monaco = buildMonaco();
    capturedEditorProps.beforeMount(monaco);

    expect(monaco.editor.defineTheme).toHaveBeenCalledWith('dark', EDITOR_THEMES_CONFIG['dark']);
  });

  test('registers JSON diagnostics for the default json language', () => {
    render(<JsonEditorBase value="{}" onChange={vi.fn()} />);

    const monaco = buildMonaco();
    capturedEditorProps.beforeMount(monaco);

    expect(monaco.languages.json.jsonDefaults.setDiagnosticsOptions).toHaveBeenCalled();
  });

  test('does not register JSON diagnostics for a non-json language', () => {
    render(<JsonEditorBase value="" onChange={vi.fn()} language="sql" />);

    const monaco = buildMonaco();
    capturedEditorProps.beforeMount(monaco);

    expect(monaco.languages.json.jsonDefaults.setDiagnosticsOptions).not.toHaveBeenCalled();
  });
});
