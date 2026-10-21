import { QueriesI18nKey } from '@/src/constants/i18n';
import { SavedQueryErrorCode } from '@/src/models/analytics/saved-query';
import { ServerActionResponse } from '@/src/models/server-action';

export interface SavedQueryErrorDescriptor {
  code: SavedQueryErrorCode | null;
  hintKey: QueriesI18nKey;
  isServerMessageShown: boolean;
  serverMessage?: string;
}

const NO_CODE_PLACEHOLDER = 'Request error';

const KNOWN_CODES: string[] = Object.values(SavedQueryErrorCode);

const HINT_KEYS: Record<SavedQueryErrorCode, QueriesI18nKey> = {
  [SavedQueryErrorCode.BadRequest]: QueriesI18nKey.ErrorGeneric,
  [SavedQueryErrorCode.ValidationError]: QueriesI18nKey.ErrorValidation,
  [SavedQueryErrorCode.SensitiveLiteralNotAllowed]: QueriesI18nKey.ErrorSensitiveLiteral,
  [SavedQueryErrorCode.Forbidden]: QueriesI18nKey.ErrorForbidden,
  [SavedQueryErrorCode.NotFound]: QueriesI18nKey.ErrorNotFound,
  [SavedQueryErrorCode.PrincipalUnavailable]: QueriesI18nKey.ErrorPrincipalUnavailable,
};

// Body refusals only: echoing an identity or visibility refusal can disclose whether a query or a
// column exists.
const CODES_WITH_SERVER_MESSAGE: SavedQueryErrorCode[] = [
  SavedQueryErrorCode.BadRequest,
  SavedQueryErrorCode.ValidationError,
  SavedQueryErrorCode.SensitiveLiteralNotAllowed,
];

export const resolveSavedQueryErrorCode = (res: ServerActionResponse): SavedQueryErrorCode | null => {
  const header = res.errorHeader;
  if (header && header !== NO_CODE_PLACEHOLDER && KNOWN_CODES.includes(header)) {
    return header as SavedQueryErrorCode;
  }
  if (res.status === 403) return SavedQueryErrorCode.Forbidden;
  if (res.status === 404) return SavedQueryErrorCode.NotFound;
  return null;
};

export const describeSavedQueryError = (res: ServerActionResponse): SavedQueryErrorDescriptor => {
  const code = resolveSavedQueryErrorCode(res);
  const isServerMessageShown = !!code && CODES_WITH_SERVER_MESSAGE.includes(code);
  return {
    code,
    hintKey: code ? HINT_KEYS[code] : QueriesI18nKey.ErrorGeneric,
    isServerMessageShown,
    serverMessage: isServerMessageShown ? res.errorMessage : void 0,
  };
};

export const isSavedQueryGone = (code: SavedQueryErrorCode | null): boolean => code === SavedQueryErrorCode.NotFound;
