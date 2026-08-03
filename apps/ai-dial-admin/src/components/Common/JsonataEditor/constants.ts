import type { languages } from 'monaco-editor';

import { JsonataFunction } from '@/src/components/Common/JsonataEditor/models';

export const JSONATA_LANGUAGE_ID = 'jsonata';

export const JSONATA_KEYWORDS = ['and', 'or', 'in', 'function', 'true', 'false', 'null'];

export const JSONATA_FUNCTIONS: JsonataFunction[] = [
  { label: '$string', signature: '$string(arg, prettify?)', description: 'Casts the argument to a string.' },
  { label: '$length', signature: '$length(str)', description: 'Number of characters in the string.' },
  {
    label: '$substring',
    signature: '$substring(str, start, length?)',
    description: 'Substring from a position.',
  },
  {
    label: '$substringBefore',
    signature: '$substringBefore(str, chars)',
    description: 'Part before the first match.',
  },
  {
    label: '$substringAfter',
    signature: '$substringAfter(str, chars)',
    description: 'Part after the first match.',
  },
  { label: '$uppercase', signature: '$uppercase(str)', description: 'Uppercased string.' },
  { label: '$lowercase', signature: '$lowercase(str)', description: 'Lowercased string.' },
  { label: '$trim', signature: '$trim(str)', description: 'Normalises and trims whitespace.' },
  { label: '$pad', signature: '$pad(str, width, char?)', description: 'Pads the string to the given width.' },
  { label: '$contains', signature: '$contains(str, pattern)', description: 'True when the pattern is found.' },
  { label: '$split', signature: '$split(str, separator, limit?)', description: 'Splits a string into an array.' },
  { label: '$join', signature: '$join(array, separator?)', description: 'Joins an array of strings.' },
  { label: '$match', signature: '$match(str, pattern, limit?)', description: 'Regex matches with their positions.' },
  { label: '$replace', signature: '$replace(str, pattern, replacement)', description: 'Replaces matches.' },
  { label: '$eval', signature: '$eval(str, context?)', description: 'Evaluates a JSONata/JSON string.' },
  { label: '$base64encode', signature: '$base64encode(str)', description: 'Base64-encodes the string.' },
  { label: '$base64decode', signature: '$base64decode(str)', description: 'Decodes a Base64 string.' },
  {
    label: '$encodeUrlComponent',
    signature: '$encodeUrlComponent(str)',
    description: 'URL-encodes a URI component.',
  },
  { label: '$encodeUrl', signature: '$encodeUrl(str)', description: 'URL-encodes a full URI.' },
  {
    label: '$decodeUrlComponent',
    signature: '$decodeUrlComponent(str)',
    description: 'Decodes a URL-encoded URI component.',
  },
  { label: '$decodeUrl', signature: '$decodeUrl(str)', description: 'Decodes a URL-encoded URI.' },
  { label: '$number', signature: '$number(arg)', description: 'Casts the argument to a number.' },
  { label: '$abs', signature: '$abs(number)', description: 'Absolute value.' },
  { label: '$floor', signature: '$floor(number)', description: 'Largest integer <= the number.' },
  { label: '$ceil', signature: '$ceil(number)', description: 'Smallest integer >= the number.' },
  { label: '$round', signature: '$round(number, precision?)', description: 'Rounds to the given precision.' },
  { label: '$power', signature: '$power(base, exponent)', description: 'Base raised to the exponent.' },
  { label: '$sqrt', signature: '$sqrt(number)', description: 'Square root.' },
  { label: '$random', signature: '$random()', description: 'Pseudo-random number between 0 and 1.' },
  { label: '$formatNumber', signature: '$formatNumber(number, picture)', description: 'Formats a number.' },
  { label: '$formatBase', signature: '$formatBase(number, radix?)', description: 'Formats a number in a base.' },
  {
    label: '$formatInteger',
    signature: '$formatInteger(number, picture)',
    description: 'Formats an integer per an XPath picture string.',
  },
  {
    label: '$parseInteger',
    signature: '$parseInteger(str, picture)',
    description: 'Parses an integer per an XPath picture string.',
  },
  { label: '$sum', signature: '$sum(array)', description: 'Sum of an array of numbers.' },
  { label: '$max', signature: '$max(array)', description: 'Largest value in an array.' },
  { label: '$min', signature: '$min(array)', description: 'Smallest value in an array.' },
  { label: '$average', signature: '$average(array)', description: 'Mean of an array of numbers.' },
  { label: '$boolean', signature: '$boolean(arg)', description: 'Casts the argument to a boolean.' },
  { label: '$not', signature: '$not(arg)', description: 'Negates the boolean value.' },
  { label: '$exists', signature: '$exists(arg)', description: 'True when the expression matches something.' },
  { label: '$count', signature: '$count(array)', description: 'Number of items in an array.' },
  { label: '$append', signature: '$append(array1, array2)', description: 'Appends two arrays.' },
  { label: '$sort', signature: '$sort(array, comparator?)', description: 'Sorts an array.' },
  { label: '$reverse', signature: '$reverse(array)', description: 'Reverses an array.' },
  { label: '$shuffle', signature: '$shuffle(array)', description: 'Randomly permutes an array.' },
  { label: '$distinct', signature: '$distinct(array)', description: 'Removes duplicate values.' },
  { label: '$zip', signature: '$zip(array1, array2, ...)', description: 'Convolves arrays into tuples.' },
  { label: '$keys', signature: '$keys(object)', description: 'Property names of an object.' },
  { label: '$lookup', signature: '$lookup(object, key)', description: 'Value of a named property.' },
  { label: '$merge', signature: '$merge(array)', description: 'Merges an array of objects into one.' },
  { label: '$spread', signature: '$spread(object)', description: 'Splits an object into single-key objects.' },
  { label: '$sift', signature: '$sift(object, function)', description: 'Keeps properties matching a predicate.' },
  { label: '$each', signature: '$each(object, function)', description: 'Applies a function to each key/value pair.' },
  { label: '$type', signature: '$type(value)', description: 'Type name of the value.' },
  { label: '$map', signature: '$map(array, function)', description: 'Applies a function to every item.' },
  { label: '$filter', signature: '$filter(array, function)', description: 'Keeps items matching a predicate.' },
  { label: '$reduce', signature: '$reduce(array, function, init?)', description: 'Folds an array into one value.' },
  { label: '$single', signature: '$single(array, function)', description: 'The single item matching a predicate.' },
  { label: '$now', signature: '$now(picture?, timezone?)', description: 'Current timestamp as ISO 8601.' },
  { label: '$millis', signature: '$millis()', description: 'Current time in milliseconds since the epoch.' },
  { label: '$fromMillis', signature: '$fromMillis(number, picture?)', description: 'Formats a millisecond value.' },
  { label: '$toMillis', signature: '$toMillis(timestamp, picture?)', description: 'Parses a timestamp to millis.' },
  { label: '$error', signature: '$error(message?)', description: 'Throws an error with the message.' },
  { label: '$assert', signature: '$assert(condition, message)', description: 'Throws unless the condition holds.' },
];

export const JSONATA_LANGUAGE_CONFIGURATION: languages.LanguageConfiguration = {
  comments: { blockComment: ['/*', '*/'] },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
};

// Every token is prefixed with the `jsonata.` language id: Monaco theme rules match token names by
// dotted prefix across all languages, so a bare `string` or `keyword` rule would restyle the JSON and
// SQL editors too (design D5).
export const JSONATA_MONARCH_TOKENS: languages.IMonarchLanguage = {
  defaultToken: '',
  keywords: JSONATA_KEYWORDS,
  tokenizer: {
    root: [
      [/\/\*/, 'jsonata.comment', '@comment'],
      [/\$\{\{[^}]*\}\}/, 'jsonata.variable.template'],
      [/\$[a-zA-Z_]\w*/, 'jsonata.variable'],
      [/\$+/, 'jsonata.variable'],
      [/[a-zA-Z_]\w*/, { cases: { '@keywords': 'jsonata.keyword', '@default': '' } }],
      [/"/, 'jsonata.string', '@stringDouble'],
      [/'/, 'jsonata.string', '@stringSingle'],
      [/`[^`]*`/, 'jsonata.variable'],
      [/\d+(\.\d+)?([eE][-+]?\d+)?/, 'jsonata.number'],
      [/[{}[\]()]/, 'jsonata.bracket'],
      [/~>|:=|\.\.|\*\*|!=|<=|>=|[-+*/%=<>!?:;,.|&@#^]/, 'jsonata.operator'],
    ],
    comment: [
      [/[^/*]+/, 'jsonata.comment'],
      [/\*\//, 'jsonata.comment', '@pop'],
      [/[/*]/, 'jsonata.comment'],
    ],
    stringDouble: [
      [/[^\\"]+/, 'jsonata.string'],
      [/\\./, 'jsonata.string.escape'],
      [/"/, 'jsonata.string', '@pop'],
    ],
    stringSingle: [
      [/[^\\']+/, 'jsonata.string'],
      [/\\./, 'jsonata.string.escape'],
      [/'/, 'jsonata.string', '@pop'],
    ],
  },
};
