import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { JSONEditorThemeConfig, EDITOR_THEMES, EditorOptions } from '@/src/types/editor';

const DEFAULT_COLORS = {
  focusBorder: '#00000000',
  'editor.foreground': '#EEF1F7',
  'editor.background': '#161B2D',
  'editorCursor.foreground': '#EEF1F7',
  'editor.selectionBackground': '#5C8DEA2B',
  'editorLineNumber.foreground': '#7C8293',
  'scrollbarSlider.background': '#242C4266',
  'scrollbarSlider.hoverBackground': '#242C4299',
  'scrollbarSlider.activeBackground': '#242C42CC',
  'minimapSlider.background': '#EEF1F71A',
  'minimapSlider.hoverBackground': '#EEF1F733',
  'minimapSlider.activeBackground': '#242C42CC',
  'diffEditor.insertedTextBackground': '#1D3841',
  'diffEditor.removedTextBackground': '#402027',
  'diffEditor.insertedTextBorder': '#37BABC',
  'diffEditor.removedTextBorder': '#F76464',
  'diffEditor.insertedLineBackground': '#00000000',
  'diffEditor.removedLineBackground': '#00000000',
  'editor.lineHighlightBorder': '#00000000',
};

export const getDiffEditorTheme = (theme: EDITOR_THEMES): JSONEditorThemeConfig => {
  const template = EDITOR_THEMES_CONFIG[theme || EDITOR_THEMES.dark];

  switch (theme) {
    case EDITOR_THEMES.light:
      return { ...template, colors: { ...template.colors, 'editor.background': '#FCFCFC' } };
    case EDITOR_THEMES.dark:
    default:
      return { ...template, colors: { ...template.colors, 'editor.background': '#1D2439' } };
  }
};

export const EDITOR_THEMES_CONFIG: Record<EDITOR_THEMES, JSONEditorThemeConfig> = {
  [EDITOR_THEMES.dark]: {
    base: 'vs-dark',
    inherit: false,
    rules: [
      { token: 'string.key.json', foreground: '#37BABC' },
      { token: 'string.value.json', foreground: '#7DA4FF' },
      { token: 'number', foreground: '#D97C27' },
      { token: 'keyword.json', foreground: '#F4CE46' },
      { token: 'delimiter', foreground: '#EEF1F7' },
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
      { token: 'delimiter', foreground: '#161B2D' },
      { token: 'delimiter.bracket.json', foreground: '#7E39EC' },
      { token: 'delimiter.parenthesis', foreground: '#7E39EC' },
    ],
    colors: {
      ...DEFAULT_COLORS,
      'editor.foreground': '#161B2D',
      'editor.background': '#EEF1F7',
      'editorCursor.foreground': '#161B2D',
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
  diffWordWrap: 'on',
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
  minimap: { enabled: true },
  overviewRulerLanes: 3,
  readOnly: true,
  renderIndicators: false,
  renderOverviewRuler: true,
  glyphMargin: false,
  // Force side-by-side so both original and modified panes get word wrap (Monaco bug workaround)
  useInlineViewWhenSpaceIsLimited: false,
};

export const editorOptions: EditorOptions = {
  ...defaultOptions,
  formatOnType: true,
  formatOnPaste: true,
};

export const IMAGE_IGNORED_FIELDS: (keyof Image)[] = ['id'];
export const CONTAINER_IGNORED_FIELDS: (keyof Container)[] = ['name', '$type'];
