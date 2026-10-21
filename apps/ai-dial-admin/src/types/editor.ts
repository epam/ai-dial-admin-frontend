import type { editor } from 'monaco-editor';

import { ThemePaletteKey } from '@/src/models/theme';

export type JSONEditorError = editor.IMarker;
export type JSONEditorThemeConfig = editor.IStandaloneThemeData;
export type EditorOptions = editor.IDiffEditorConstructionOptions;

export interface JSONEditorErrorNotification extends JSONEditorError {
  id: string;
}

export interface JsonEditorOwnedError extends JSONEditorError {
  editorId: string;
}

export enum EDITOR_THEMES {
  dark = 'dark',
  light = 'light',
}

/** What one Monaco theme takes from outside its palette. */
export interface EditorThemeSpec {
  base: editor.BuiltinTheme;
  /** Palette key of the editor's surface. */
  editorBackground: ThemePaletteKey;
  /** Palette key of the diff editor's surface. */
  diffBackground: ThemePaletteKey;
  /** Number and keyword colors: the palette has no token for either. */
  numberColor: string;
  keywordColor: string;
}
