import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';

/**
 * A validation error tagged with the editor instance (`useId()`) that raised it. The tag survives
 * the trip through `SaveValidationContext` (flattened across editors) and into any notification
 * created from it, since both are plain object spreads that keep unknown fields. Unmount cleanup
 * uses the tag to remove exactly this editor's own notifications, even when another mounted editor
 * has an identical message and line.
 */
export interface JsonEditorOwnedError extends JSONEditorError {
  editorId: string;
}

export interface JsonEditorOwnedNotification extends JSONEditorErrorNotification {
  editorId: string;
}
