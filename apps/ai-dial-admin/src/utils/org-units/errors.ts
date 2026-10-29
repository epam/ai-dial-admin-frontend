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
