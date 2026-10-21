import type { editor } from 'monaco-editor';

/** The popup is driven from the reference tree, so Monaco's automatic hints and tooltips are switched off. */
export const EDITOR_HINTS_OFF_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  quickSuggestions: false,
  suggestOnTriggerCharacters: false,
  wordBasedSuggestions: 'off',
  acceptSuggestionOnEnter: 'off',
  tabCompletion: 'off',
  parameterHints: { enabled: false },
  inlineSuggest: { enabled: false },
  hover: { enabled: false },
};
