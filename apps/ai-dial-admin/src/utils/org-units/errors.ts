import { ServerActionResponse } from '@/src/models/server-action';

export enum OrgUnitErrorKind {
  /** 400/409: show next to the field or in the dialog, with core's message. */
  FIELD = 'field',
  /** 403: hide the control or card. */
  FORBIDDEN = 'forbidden',
  /** 404: units are off, or the parent is not a unit. */
  NOT_FOUND = 'notFound',
  /** 5xx or no answer. */
  UNAVAILABLE = 'unavailable',
}

export interface OrgUnitError {
  kind: OrgUnitErrorKind;
  status?: number;
  message?: string;
}

export const mapOrgUnitError = (response: ServerActionResponse): OrgUnitError => {
  const { status, errorMessage: message } = response;
  switch (status) {
    case 400:
    case 409:
      return { kind: OrgUnitErrorKind.FIELD, status, message };
    case 403:
      return { kind: OrgUnitErrorKind.FORBIDDEN, status, message };
    case 404:
      return { kind: OrgUnitErrorKind.NOT_FOUND, status, message };
    default:
      return { kind: OrgUnitErrorKind.UNAVAILABLE, status, message };
  }
};

const CONTENT_BLOCK = /^.+? content: (.+)\. Delete or move it first\.$/s;
const CONTENT_ITEMS_SEPARATOR = ', ';
const FOLDER_MARKER = '.dial_folder';
const FILES_URL_PREFIX = 'files/';

const getLastSegment = (url: string): string => url.split('/').filter(Boolean).pop() ?? url;

/** Last segment of a core item url, decoded: `applications/public/A/app__1.0.0` -> `app__1.0.0`. */
export const getContentItemName = (url: string): string => {
  const name = getLastSegment(url);
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
};

/** The technical empty-folder marker core keeps in a unit's folders; it is never content, whatever the url looks like. */
export const isFolderMarkerUrl = (url: string): boolean => getContentItemName(url) === FOLDER_MARKER;

/** A marker in the files tree, the only one the files API can delete. */
export const isFilesMarkerUrl = (url: string): boolean => url.startsWith(FILES_URL_PREFIX) && isFolderMarkerUrl(url);

/** Path of a core files url as the files API takes it: `files/public/A/x` -> `public/A/x`. */
export const toFilePath = (url: string): string => url.slice(FILES_URL_PREFIX.length);

/** Urls core lists when it refuses to remove a unit that still holds content; `undefined` for any other message. */
export const parseUnitContentBlock = (message?: string): string[] | undefined =>
  message?.match(CONTENT_BLOCK)?.[1]?.split(CONTENT_ITEMS_SEPARATOR);
