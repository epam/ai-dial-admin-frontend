import type { Monaco } from '@monaco-editor/react';
import type { editor, json } from 'monaco-editor';

import { MonacoJsonErrorI18nKey } from '@/src/constants/i18n';

/**
 * The instance the console hands `@monaco-editor/react`. The library types it as the core editor API only;
 * the console's entry also carries the JSON language namespace.
 */
export interface BundledMonaco extends Monaco {
  json: typeof json;
}

export type MonacoTranslate = (key: string, options?: Record<string, string | number>) => string;

export type JsonMarkerMessage = Pick<editor.IMarker, 'code' | 'message'>;

/** One message of the JSON language service whose code is not unique, matched by its English wording. */
export interface JsonErrorTemplate {
  key: MonacoJsonErrorI18nKey;
  /** Monaco's English text, with `{0}`, `{1}` where it inserts a value. */
  template: string;
  /** The i18n parameter each `{n}` is passed as, in order. */
  params?: string[];
}
