import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { SavedQueryErrorCode } from '@/src/models/analytics/saved-query';
import { ServerActionResponse } from '@/src/models/server-action';

export interface SavedQueryErrorDescriptor {
  code: SavedQueryErrorCode | null;
  hintKey: QueryBuilderI18nKey;
  // The service's own message is shown alongside our hint only where the fix is in the query rather
  // than in the form — an untranslatable body, a rejected value, or the column a sensitive literal
  // sits on, which only the service can name.
  showServerMessage: boolean;
  serverMessage?: string;
}

const KNOWN_CODES = new Set<string>(Object.values(SavedQueryErrorCode));

const HINT_KEYS: Record<SavedQueryErrorCode, QueryBuilderI18nKey> = {
  [SavedQueryErrorCode.BadRequest]: QueryBuilderI18nKey.SavedQueryErrorGeneric,
  [SavedQueryErrorCode.SensitiveLiteralNotAllowed]: QueryBuilderI18nKey.SavedQueryErrorSensitiveLiteral,
  [SavedQueryErrorCode.ValidationError]: QueryBuilderI18nKey.SavedQueryErrorValidation,
  [SavedQueryErrorCode.Forbidden]: QueryBuilderI18nKey.SavedQueryErrorForbidden,
  [SavedQueryErrorCode.NotFound]: QueryBuilderI18nKey.SavedQueryErrorNotFound,
  [SavedQueryErrorCode.PrincipalUnavailable]: QueryBuilderI18nKey.SavedQueryErrorPrincipalUnavailable,
};

const CODES_WITH_SERVER_MESSAGE = new Set<SavedQueryErrorCode>([
  SavedQueryErrorCode.BadRequest,
  SavedQueryErrorCode.SensitiveLiteralNotAllowed,
  SavedQueryErrorCode.ValidationError,
]);

// `BaseApi` maps the service's ErrorView.error — the stable machine code — onto `errorHeader`, but
// `getError` substitutes the literal 'Request error' when the body carried none, so a header that is
// not a known code says nothing. Match the codes explicitly and fall back on the status only for the
// two whose meaning the status alone already fixes.
export const resolveSavedQueryErrorCode = (res: ServerActionResponse): SavedQueryErrorCode | null => {
  const header = res.errorHeader;
  if (header && KNOWN_CODES.has(header)) return header as SavedQueryErrorCode;
  if (res.status === 403) return SavedQueryErrorCode.Forbidden;
  if (res.status === 404) return SavedQueryErrorCode.NotFound;
  return null;
};

export const describeSavedQueryError = (res: ServerActionResponse): SavedQueryErrorDescriptor => {
  const code = resolveSavedQueryErrorCode(res);
  if (!code) {
    return { code: null, hintKey: QueryBuilderI18nKey.SavedQueryErrorGeneric, showServerMessage: false };
  }
  const showServerMessage = CODES_WITH_SERVER_MESSAGE.has(code);
  return {
    code,
    hintKey: HINT_KEYS[code],
    showServerMessage,
    serverMessage: showServerMessage ? res.errorMessage : undefined,
  };
};

// A vanished saved query is not retried: an unknown id and another caller's personal row are the same
// answer by design, so the only useful response is to refresh what the list claims exists.
export const isSavedQueryGone = (code: SavedQueryErrorCode | null): boolean => code === SavedQueryErrorCode.NotFound;
