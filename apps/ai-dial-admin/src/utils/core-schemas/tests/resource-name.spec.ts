import { describe, expect, test } from 'vitest';

import { CORE_UNENCODABLE_ID_CHARS } from '../constants';
import { fromCoreSchemaResourceName, hasUnencodableSchemaIdChars, toCoreSchemaResourceName } from '../resource-name';

const ID = 'https://mydial.epam.com/custom_application_schemas/qq';
const ENCODED = 'https%3A%2F%2Fmydial.epam.com%2Fcustom_application_schemas%2Fqq';

/** Core's ENTITY_NAME_PATTERN, applied to the URL-decoded path segment on PUT/DELETE. */
const ENTITY_NAME_PATTERN = /^[A-Za-z0-9._%:-]+$/;

describe('Core Schema Utils :: toCoreSchemaResourceName', () => {
  test('Should encode the id once', () => {
    expect(toCoreSchemaResourceName(ID)).toEqual(ENCODED);
  });

  test('Should produce a name Core accepts as an entity name', () => {
    expect(ENTITY_NAME_PATTERN.test(toCoreSchemaResourceName(ID))).toBe(true);
  });

  test('Should leave a name with no reserved characters unchanged', () => {
    expect(toCoreSchemaResourceName('simple-runner_1.0')).toEqual('simple-runner_1.0');
  });
});

describe('Core Schema Utils :: fromCoreSchemaResourceName', () => {
  test('Should reverse toCoreSchemaResourceName', () => {
    expect(fromCoreSchemaResourceName(toCoreSchemaResourceName(ID))).toEqual(ID);
  });

  test('Should return a malformed escape sequence unchanged', () => {
    expect(fromCoreSchemaResourceName('%E0%A4%A')).toEqual('%E0%A4%A');
  });
});

describe('Core Schema Utils :: hasUnencodableSchemaIdChars', () => {
  test.each([ID, 'https://host/a_b', 'plain-name', 'a.b:c-d'])('Should accept %s', (id) => {
    expect(hasUnencodableSchemaIdChars(id)).toBe(false);
  });

  test.each(CORE_UNENCODABLE_ID_CHARS)('Should reject an id containing %s', (char) => {
    expect(hasUnencodableSchemaIdChars(`https://host/schema${char}`)).toBe(true);
  });

  test('Should reject ids whose encoded form Core would refuse', () => {
    const id = "https://host/it's-here";
    expect(hasUnencodableSchemaIdChars(id)).toBe(true);
    expect(ENTITY_NAME_PATTERN.test(toCoreSchemaResourceName(id))).toBe(false);
  });

  test.each(CORE_UNENCODABLE_ID_CHARS)(
    'Should list %s as unencodable only because encodeURIComponent leaves it bare',
    (char) => {
      expect(encodeURIComponent(char)).toEqual(char);
      expect(ENTITY_NAME_PATTERN.test(char)).toBe(false);
    },
  );
});
