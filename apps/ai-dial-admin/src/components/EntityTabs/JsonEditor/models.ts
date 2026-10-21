import { JSONEditorErrorNotification } from '@/src/types/editor';

/**
 * A validation notification tagged with the editor instance (`useId()`) that raised it — the same
 * tag `useJsonEditorValidation` puts on the error it was created from. Unmount cleanup uses it to
 * remove exactly this editor's own notifications, even when another mounted editor has an identical
 * message and line.
 */
export interface JsonEditorOwnedNotification extends JSONEditorErrorNotification {
  editorId: string;
}
