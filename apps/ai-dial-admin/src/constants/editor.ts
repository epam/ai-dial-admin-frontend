import { JSONEditorThemeConfig, EDITOR_THEMES, EditorOptions } from '@/src/types/editor';

const DEFAULT_COLORS = {
  focusBorder: '#00000000',
  'editor.foreground': '#F3F4F6',
  'editor.background': '#141A23',
  'editorCursor.foreground': '#F3F4F6',
  'editor.selectionBackground': '#5C8DEA2B',
  'editorLineNumber.foreground': '#333942',
  'scrollbarSlider.background': '#333942',
  'scrollbarSlider.hoverBackground': '#333942',
  'scrollbarSlider.activeBackground': '#333942',
  'diffEditor.insertedTextBackground': '#1D3841',
  'diffEditor.removedTextBackground': '#402027',
  'diffEditor.insertedTextBorder': '#37BABC',
  'diffEditor.removedTextBorder': '#F76464',
  'diffEditor.insertedLineBackground': '#00000000',
  'diffEditor.removedLineBackground': '#00000000',
  'editor.lineHighlightBorder': '#00000000',
};

export const getDiffEditorTheme = (theme: EDITOR_THEMES): JSONEditorThemeConfig => {
  const template = EDITOR_THEMES_CONFIG[theme];

  switch (theme) {
    case EDITOR_THEMES.dark:
      return { ...template, colors: { ...template.colors, 'editor.background': '#222932' } };
    case EDITOR_THEMES.light:
      return { ...template, colors: { ...template.colors, 'editor.background': '#FCFCFC' } };
  }
};

export const EDITOR_THEMES_CONFIG: Record<EDITOR_THEMES, JSONEditorThemeConfig> = {
  [EDITOR_THEMES.dark]: {
    base: 'vs-dark',
    inherit: false,
    rules: [
      { token: 'string.key.json', foreground: '#37BABC' },
      { token: 'string.value.json', foreground: '#74A4FF' },
      { token: 'number', foreground: '#D97C27' },
      { token: 'keyword.json', foreground: '#F4CE46' },
      { token: 'delimiter', foreground: '#F3F4F6' },
      { token: 'delimiter.bracket.json', foreground: '#A972FF' },
      { token: 'delimiter.parenthesis', foreground: '#A972FF' },
    ],
    colors: {
      ...DEFAULT_COLORS,
    },
  },
  [EDITOR_THEMES.light]: {
    base: 'vs',
    inherit: false,
    rules: [
      { token: 'string.key.json', foreground: '#009D9F' },
      { token: 'string.value.json', foreground: '#2764D9' },
      { token: 'number', foreground: '#B25500' },
      { token: 'keyword.json', foreground: '#3F3D25' },
      { token: 'delimiter', foreground: '#141A23' },
      { token: 'delimiter.bracket.json', foreground: '#843EF3' },
      { token: 'delimiter.parenthesis', foreground: '#843EF3' },
    ],
    colors: {
      ...DEFAULT_COLORS,
      'editor.foreground': '#141A23',
      'editor.background': '#F3F4F6',
      'editorCursor.foreground': '#141A23',
      'diffEditor.insertedTextBackground': '#CEEBEE',
      'diffEditor.removedTextBackground': '#F3D6D8',
    },
  },
};

const defaultOptions: EditorOptions = {
  minimap: { enabled: false },
  selectOnLineNumbers: false,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  smoothScrolling: true,
  overviewRulerLanes: 0,
  scrollbar: {
    verticalScrollbarSize: 6,
    verticalSliderSize: 6,
    horizontalScrollbarSize: 6,
    horizontalSliderSize: 6,
  },
};

export const diffEditorOptions: EditorOptions = {
  ...defaultOptions,
  readOnly: true,
  renderIndicators: false,
  renderOverviewRuler: false,
  glyphMargin: false,
};

export const editorOptions: EditorOptions = {
  ...defaultOptions,
  formatOnType: true,
  formatOnPaste: true,
};
