import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { ThemePalette } from '@/src/models/theme';
import { EDITOR_THEMES, EditorOptions, EditorThemeSpec, JSONEditorThemeConfig } from '@/src/types/editor';
import { getThemePalette } from '@/src/utils/themes/get-theme-palette';

// Each theme keeps the surfaces it had before the palettes existed: the dark editor sits one layer
// above the diff, the light one a layer below it.
const EDITOR_THEME_SPECS: Record<EDITOR_THEMES, EditorThemeSpec> = {
  [EDITOR_THEMES.dark]: {
    base: 'vs-dark',
    editorBackground: 'bg-layer-2',
    diffBackground: 'bg-layer-3',
    numberColor: '#D97C27',
    keywordColor: '#F4CE46',
  },
  [EDITOR_THEMES.light]: {
    base: 'vs',
    editorBackground: 'bg-layer-3',
    diffBackground: 'bg-layer-2',
    numberColor: '#B25500',
    keywordColor: '#3F3D25',
  },
};

const TRANSPARENT = '#00000000';

// Monaco takes a theme as literal colors and cannot resolve CSS variables, so both themes read the
// concrete values of their palette.
const buildEditorTheme = (palette: ThemePalette, spec: EditorThemeSpec): JSONEditorThemeConfig => {
  const key = palette['text-accent-secondary'];
  const value = palette['text-accent-primary'];
  const bracket = palette['text-accent-tertiary'];
  const text = palette['text-primary'];
  const muted = palette['controls-text-primary-disable'];
  const slider = palette['stroke-primary'];

  return {
    base: spec.base,
    inherit: false,
    rules: [
      { token: 'string.key.json', foreground: key },
      { token: 'string.value.json', foreground: value },
      { token: 'number', foreground: spec.numberColor },
      { token: 'keyword.json', foreground: spec.keywordColor },
      { token: 'delimiter', foreground: text },
      { token: 'delimiter.bracket.json', foreground: bracket },
      { token: 'delimiter.parenthesis', foreground: bracket },
      { token: 'jsonata.string', foreground: value },
      { token: 'jsonata.string.escape', foreground: value },
      { token: 'jsonata.number', foreground: spec.numberColor },
      { token: 'jsonata.keyword', foreground: spec.keywordColor },
      { token: 'jsonata.variable', foreground: key },
      { token: 'jsonata.variable.template', foreground: bracket },
      { token: 'jsonata.operator', foreground: text },
      { token: 'jsonata.bracket', foreground: bracket },
      { token: 'jsonata.comment', foreground: muted },
    ],
    colors: {
      focusBorder: TRANSPARENT,
      'editor.foreground': text,
      'editor.background': palette[spec.editorBackground],
      'editorCursor.foreground': text,
      'editor.selectionBackground': `${palette['bg-accent-primary']}2B`,
      'editor.lineHighlightBorder': TRANSPARENT,
      'editorLineNumber.foreground': muted,
      'scrollbarSlider.background': `${slider}66`,
      'scrollbarSlider.hoverBackground': `${slider}99`,
      'scrollbarSlider.activeBackground': `${slider}CC`,
      'minimapSlider.background': `${text}1A`,
      'minimapSlider.hoverBackground': `${text}33`,
      'minimapSlider.activeBackground': `${slider}CC`,
      'diffEditor.insertedTextBackground': palette['bg-success'],
      'diffEditor.removedTextBackground': palette['bg-error'],
      'diffEditor.insertedTextBorder': palette['text-success'],
      'diffEditor.removedTextBorder': palette['stroke-error'],
      'diffEditor.insertedLineBackground': TRANSPARENT,
      'diffEditor.removedLineBackground': TRANSPARENT,
    },
  };
};

export const EDITOR_THEMES_CONFIG: Record<EDITOR_THEMES, JSONEditorThemeConfig> = {
  [EDITOR_THEMES.dark]: buildEditorTheme(getThemePalette(EDITOR_THEMES.dark), EDITOR_THEME_SPECS[EDITOR_THEMES.dark]),
  [EDITOR_THEMES.light]: buildEditorTheme(
    getThemePalette(EDITOR_THEMES.light),
    EDITOR_THEME_SPECS[EDITOR_THEMES.light],
  ),
};

export const getDiffEditorTheme = (theme: EDITOR_THEMES): JSONEditorThemeConfig => {
  const themeId = theme || EDITOR_THEMES.dark;
  const template = EDITOR_THEMES_CONFIG[themeId];
  const background = getThemePalette(themeId)[EDITOR_THEME_SPECS[themeId].diffBackground];

  return { ...template, colors: { ...template.colors, 'editor.background': background } };
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
