import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { JSONEditorThemeConfig, EDITOR_THEMES, EditorOptions } from '@/src/types/editor';
import { fallbackDarkTheme as dark } from '@/src/utils/themes/constant';

// Monaco takes a theme as literal colors and cannot resolve CSS variables, so the dark theme reads
// the dark palette's concrete values.
const SHARED_COLORS = {
  focusBorder: '#00000000',
  'editor.selectionBackground': '#5C8DEA2B',
  'diffEditor.insertedLineBackground': '#00000000',
  'diffEditor.removedLineBackground': '#00000000',
  'editor.lineHighlightBorder': '#00000000',
};

const DARK_COLORS = {
  ...SHARED_COLORS,
  'editor.foreground': dark['text-primary'],
  'editor.background': dark['bg-layer-2'],
  'editorCursor.foreground': dark['text-primary'],
  'editorLineNumber.foreground': dark['controls-text-primary-disable'],
  'scrollbarSlider.background': `${dark['bg-layer-4']}66`,
  'scrollbarSlider.hoverBackground': `${dark['bg-layer-4']}99`,
  'scrollbarSlider.activeBackground': `${dark['bg-layer-4']}CC`,
  'minimapSlider.background': `${dark['text-primary']}1A`,
  'minimapSlider.hoverBackground': `${dark['text-primary']}33`,
  'minimapSlider.activeBackground': `${dark['bg-layer-4']}CC`,
  'diffEditor.insertedTextBackground': dark['bg-success'],
  'diffEditor.removedTextBackground': dark['bg-error'],
  'diffEditor.insertedTextBorder': dark['text-success'],
  'diffEditor.removedTextBorder': dark['stroke-error'],
};

const LIGHT_COLORS = {
  ...SHARED_COLORS,
  'editor.foreground': '#161B2D',
  'editor.background': '#EEF1F7',
  'editorCursor.foreground': '#161B2D',
  'editorLineNumber.foreground': '#7C8293',
  'scrollbarSlider.background': '#242C4266',
  'scrollbarSlider.hoverBackground': '#242C4299',
  'scrollbarSlider.activeBackground': '#242C42CC',
  'minimapSlider.background': '#EEF1F71A',
  'minimapSlider.hoverBackground': '#EEF1F733',
  'minimapSlider.activeBackground': '#242C42CC',
  'diffEditor.insertedTextBackground': '#CEEBEE',
  'diffEditor.removedTextBackground': '#F3D6D8',
  'diffEditor.insertedTextBorder': '#37BABC',
  'diffEditor.removedTextBorder': '#F76464',
};

export const getDiffEditorTheme = (theme: EDITOR_THEMES): JSONEditorThemeConfig => {
  const template = EDITOR_THEMES_CONFIG[theme || EDITOR_THEMES.dark];

  switch (theme) {
    case EDITOR_THEMES.light:
      return { ...template, colors: { ...template.colors, 'editor.background': '#FCFCFC' } };
    case EDITOR_THEMES.dark:
    default:
      return { ...template, colors: { ...template.colors, 'editor.background': dark['bg-layer-3'] } };
  }
};

export const EDITOR_THEMES_CONFIG: Record<EDITOR_THEMES, JSONEditorThemeConfig> = {
  [EDITOR_THEMES.dark]: {
    base: 'vs-dark',
    inherit: false,
    rules: [
      { token: 'string.key.json', foreground: dark['text-accent-secondary'] },
      { token: 'string.value.json', foreground: dark['text-accent-primary'] },
      { token: 'number', foreground: '#D97C27' },
      { token: 'keyword.json', foreground: '#F4CE46' },
      { token: 'delimiter', foreground: dark['text-primary'] },
      { token: 'delimiter.bracket.json', foreground: dark['text-accent-tertiary'] },
      { token: 'delimiter.parenthesis', foreground: dark['text-accent-tertiary'] },
      { token: 'jsonata.string', foreground: dark['text-accent-primary'] },
      { token: 'jsonata.string.escape', foreground: dark['text-accent-primary'] },
      { token: 'jsonata.number', foreground: '#D97C27' },
      { token: 'jsonata.keyword', foreground: '#F4CE46' },
      { token: 'jsonata.variable', foreground: dark['text-accent-secondary'] },
      { token: 'jsonata.variable.template', foreground: dark['text-accent-tertiary'] },
      { token: 'jsonata.operator', foreground: dark['text-primary'] },
      { token: 'jsonata.bracket', foreground: dark['text-accent-tertiary'] },
      { token: 'jsonata.comment', foreground: dark['controls-text-primary-disable'] },
    ],
    colors: DARK_COLORS,
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
      { token: 'jsonata.string', foreground: '#2764D9' },
      { token: 'jsonata.string.escape', foreground: '#2764D9' },
      { token: 'jsonata.number', foreground: '#B25500' },
      { token: 'jsonata.keyword', foreground: '#3F3D25' },
      { token: 'jsonata.variable', foreground: '#009D9F' },
      { token: 'jsonata.variable.template', foreground: '#7E39EC' },
      { token: 'jsonata.operator', foreground: '#161B2D' },
      { token: 'jsonata.bracket', foreground: '#7E39EC' },
      { token: 'jsonata.comment', foreground: '#7C8293' },
    ],
    colors: LIGHT_COLORS,
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
