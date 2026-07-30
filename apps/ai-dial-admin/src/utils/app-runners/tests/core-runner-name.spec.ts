import { describe, expect, test } from 'vitest';

import { fromCoreRunnerName, isValidRunnerId, toCoreRunnerName } from '../core-runner-name';

const ID = 'https://mydial.epam.com/custom_application_schemas/qq';
const ENCODED = 'https%3A%2F%2Fmydial.epam.com%2Fcustom_application_schemas%2Fqq';

/** Core's ENTITY_NAME_PATTERN, applied to the URL-decoded path segment on PUT/DELETE. */
const ENTITY_NAME_PATTERN = /^[A-Za-z0-9._%:-]+$/;

describe('App Runner Utils :: toCoreRunnerName', () => {
  test('Should encode the id once', () => {
    expect(toCoreRunnerName(ID)).toEqual(ENCODED);
  });

  test('Should produce a name Core accepts as an entity name', () => {
    expect(ENTITY_NAME_PATTERN.test(toCoreRunnerName(ID))).toBe(true);
  });

  test('Should leave a name with no reserved characters unchanged', () => {
    expect(toCoreRunnerName('simple-runner_1.0')).toEqual('simple-runner_1.0');
  });
});

describe('App Runner Utils :: fromCoreRunnerName', () => {
  test('Should reverse toCoreRunnerName', () => {
    expect(fromCoreRunnerName(toCoreRunnerName(ID))).toEqual(ID);
  });

  test('Should return a malformed escape sequence unchanged', () => {
    expect(fromCoreRunnerName('%E0%A4%A')).toEqual('%E0%A4%A');
  });
});

describe('App Runner Utils :: isValidRunnerId', () => {
  test.each([ID, 'https://host/a_b', 'plain-name', 'a.b:c-d'])('Should accept %s', (id) => {
    expect(isValidRunnerId(id)).toBe(true);
  });

  test.each(['!', '~', '*', "'", '(', ')'])('Should reject an id containing %s', (char) => {
    expect(isValidRunnerId(`https://host/schema${char}`)).toBe(false);
  });

  test.each([undefined, ''])('Should reject %s', (id) => {
    expect(isValidRunnerId(id)).toBe(false);
  });

  test('Should reject ids whose encoded form Core would refuse', () => {
    const id = "https://host/it's-here";
    expect(isValidRunnerId(id)).toBe(false);
    expect(ENTITY_NAME_PATTERN.test(toCoreRunnerName(id))).toBe(false);
  });
});
