import { MonacoJsonErrorI18nKey } from '@/src/constants/i18n';

import type { JsonErrorTemplate } from '@/src/components/Common/MonacoEditor/models';

/**
 * Locales whose message bundle in `monaco-editor/esm/nls.messages.<locale>.js` carries translations. Monaco
 * 0.55.1 also ships `pt-br`, but every entry in it is `null`, so it is left out.
 */
export const MONACO_TRANSLATED_LOCALES = ['cs', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pl', 'ru', 'tr', 'zh-cn', 'zh-tw'];

/** Marker owner the JSON language service writes its diagnostics under. */
export const JSON_MARKER_OWNER = 'json';

/** Label Monaco passes to `MonacoEnvironment.getWorker` when the JSON language service needs its worker. */
export const JSON_WORKER_LABEL = 'json';

/** Syntax errors whose `ErrorCode` in `vscode-json-languageservice` identifies a single message. */
export const JSON_ERROR_KEYS_BY_CODE: Record<string, MonacoJsonErrorI18nKey> = {
  '257': MonacoJsonErrorI18nKey.UnexpectedEndOfComment,
  '258': MonacoJsonErrorI18nKey.UnexpectedEndOfString,
  '259': MonacoJsonErrorI18nKey.UnexpectedEndOfNumber,
  '260': MonacoJsonErrorI18nKey.InvalidUnicode,
  '261': MonacoJsonErrorI18nKey.InvalidEscapeCharacter,
  '262': MonacoJsonErrorI18nKey.InvalidCharacter,
  '513': MonacoJsonErrorI18nKey.PropertyExpected,
  '514': MonacoJsonErrorI18nKey.CommaExpected,
  '515': MonacoJsonErrorI18nKey.ColonExpected,
  '516': MonacoJsonErrorI18nKey.ValueExpected,
  '517': MonacoJsonErrorI18nKey.CommaOrCloseBracketExpected,
  '518': MonacoJsonErrorI18nKey.CommaOrCloseBraceExpected,
  '519': MonacoJsonErrorI18nKey.TrailingComma,
  '520': MonacoJsonErrorI18nKey.DuplicateKey,
  '521': MonacoJsonErrorI18nKey.CommentNotPermitted,
  '528': MonacoJsonErrorI18nKey.PropertyKeysMustBeDoubleQuoted,
};

/**
 * Messages that share a code (`0`, `1`, `2`) or carry none — schema violations and a few syntax errors — as the
 * pinned `vscode-json-languageservice` words them.
 */
export const JSON_ERROR_TEMPLATES: JsonErrorTemplate[] = [
  { key: MonacoJsonErrorI18nKey.InvalidNumberFormat, template: 'Invalid number format.' },
  { key: MonacoJsonErrorI18nKey.ValueOrLiteralExpected, template: 'Expected a JSON object, array or literal.' },
  { key: MonacoJsonErrorI18nKey.EndOfFileExpected, template: 'End of file expected.' },
  {
    key: MonacoJsonErrorI18nKey.InvalidColorFormat,
    template: 'Invalid color format. Use #RGB, #RGBA, #RRGGBB or #RRGGBBAA.',
  },
  { key: MonacoJsonErrorI18nKey.NotDateTime, template: 'String is not a RFC3339 date-time.' },
  { key: MonacoJsonErrorI18nKey.NotDate, template: 'String is not a RFC3339 date.' },
  { key: MonacoJsonErrorI18nKey.NotTime, template: 'String is not a RFC3339 time.' },
  { key: MonacoJsonErrorI18nKey.NotEmail, template: 'String is not an e-mail address.' },
  { key: MonacoJsonErrorI18nKey.NotHostname, template: 'String is not a hostname.' },
  { key: MonacoJsonErrorI18nKey.NotIpv4, template: 'String is not an IPv4 address.' },
  { key: MonacoJsonErrorI18nKey.NotIpv6, template: 'String is not an IPv6 address.' },
  {
    key: MonacoJsonErrorI18nKey.EnumValueMismatch,
    template: 'Value is not accepted. Valid values: {0}.',
    params: ['values'],
  },
  {
    key: MonacoJsonErrorI18nKey.IncorrectTypeOneOf,
    template: 'Incorrect type. Expected one of {0}.',
    params: ['types'],
  },
  { key: MonacoJsonErrorI18nKey.IncorrectType, template: 'Incorrect type. Expected "{0}".', params: ['type'] },
  { key: MonacoJsonErrorI18nKey.NotAllowedSchemaMatch, template: 'Matches a schema that is not allowed.' },
  {
    key: MonacoJsonErrorI18nKey.MultipleSchemasMatch,
    template: 'Matches multiple schemas when only one must validate.',
  },
  { key: MonacoJsonErrorI18nKey.ConstMismatch, template: 'Value must be {0}.', params: ['value'] },
  { key: MonacoJsonErrorI18nKey.Deprecated, template: 'Value is deprecated' },
  { key: MonacoJsonErrorI18nKey.NotMultipleOf, template: 'Value is not divisible by {0}.', params: ['divisor'] },
  {
    key: MonacoJsonErrorI18nKey.BelowExclusiveMinimum,
    template: 'Value is below the exclusive minimum of {0}.',
    params: ['limit'],
  },
  {
    key: MonacoJsonErrorI18nKey.AboveExclusiveMaximum,
    template: 'Value is above the exclusive maximum of {0}.',
    params: ['limit'],
  },
  { key: MonacoJsonErrorI18nKey.BelowMinimum, template: 'Value is below the minimum of {0}.', params: ['limit'] },
  { key: MonacoJsonErrorI18nKey.AboveMaximum, template: 'Value is above the maximum of {0}.', params: ['limit'] },
  {
    key: MonacoJsonErrorI18nKey.StringTooShort,
    template: 'String is shorter than the minimum length of {0}.',
    params: ['limit'],
  },
  {
    key: MonacoJsonErrorI18nKey.StringTooLong,
    template: 'String is longer than the maximum length of {0}.',
    params: ['limit'],
  },
  {
    key: MonacoJsonErrorI18nKey.PatternMismatch,
    template: 'String does not match the pattern of "{0}".',
    params: ['pattern'],
  },
  { key: MonacoJsonErrorI18nKey.UriExpected, template: 'URI expected.' },
  { key: MonacoJsonErrorI18nKey.UriIsExpected, template: 'URI is expected.' },
  { key: MonacoJsonErrorI18nKey.UriSchemeExpected, template: 'URI with a scheme is expected.' },
  { key: MonacoJsonErrorI18nKey.NotUri, template: 'String is not a URI: {0}', params: ['reason'] },
  {
    key: MonacoJsonErrorI18nKey.TooManyItemsForSchema,
    template: 'Array has too many items according to schema. Expected {0} or fewer.',
    params: ['limit'],
  },
  { key: MonacoJsonErrorI18nKey.MissingContainedItem, template: 'Array does not contain required item.' },
  {
    key: MonacoJsonErrorI18nKey.TooFewContainedItems,
    template: 'Array has too few items that match the contains contraint. Expected {0} or more.',
    params: ['limit'],
  },
  {
    key: MonacoJsonErrorI18nKey.TooManyContainedItems,
    template: 'Array has too many items that match the contains contraint. Expected {0} or less.',
    params: ['limit'],
  },
  {
    key: MonacoJsonErrorI18nKey.ItemMatchesNoRule,
    template: 'Item does not match any validation rule from the array.',
  },
  {
    key: MonacoJsonErrorI18nKey.TooFewItems,
    template: 'Array has too few items. Expected {0} or more.',
    params: ['limit'],
  },
  {
    key: MonacoJsonErrorI18nKey.TooManyItems,
    template: 'Array has too many items. Expected {0} or fewer.',
    params: ['limit'],
  },
  { key: MonacoJsonErrorI18nKey.DuplicateItems, template: 'Array has duplicate items.' },
  { key: MonacoJsonErrorI18nKey.MissingProperty, template: 'Missing property "{0}".', params: ['property'] },
  { key: MonacoJsonErrorI18nKey.PropertyNotAllowed, template: 'Property {0} is not allowed.', params: ['property'] },
  {
    key: MonacoJsonErrorI18nKey.TooManyProperties,
    template: 'Object has more properties than limit of {0}.',
    params: ['limit'],
  },
  {
    key: MonacoJsonErrorI18nKey.TooFewProperties,
    template: 'Object has fewer properties than the required number of {0}',
    params: ['limit'],
  },
  {
    key: MonacoJsonErrorI18nKey.MissingDependentProperty,
    template: 'Object is missing property {0} required by property {1}.',
    params: ['property', 'dependent'],
  },
];
