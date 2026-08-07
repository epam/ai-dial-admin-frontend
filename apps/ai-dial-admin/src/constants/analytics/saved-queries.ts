import { SavedQueryScope } from '@/src/models/analytics/saved-query';

// The library dialog holds a list and a readable preview side by side. The list needs enough room for a
// name plus its source and period on one line — an absolute period spells out two timestamps, which is
// the longest thing a row ever shows.
export const SAVED_QUERIES_DIALOG_HEIGHT = 540;
export const SAVED_QUERIES_LIST_WIDTH = 420;

export const SAVED_QUERIES_SCOPES: SavedQueryScope[] = [SavedQueryScope.Personal, SavedQueryScope.Common];

// Rows carrying no tag are collected under one group rendered last. Not a tag value — a saved query's
// tag is free text, so no sentinel string could be guaranteed not to collide with a real one.
export const SAVED_QUERY_UNTAGGED_GROUP = Symbol('untagged');
