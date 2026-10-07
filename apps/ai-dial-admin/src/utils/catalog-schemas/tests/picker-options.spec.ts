import { describe, expect, test } from 'vitest';

import { CatalogEntityType, CatalogSchemaOption } from '@/src/models/dial/catalog-schema';
import { filterCatalogSchemaOptionsByEntityType } from '@/src/utils/catalog-schemas/picker-options';

const modelCard: CatalogSchemaOption = {
  $id: 'https://host/model-card',
  'dial:catalogEntityType': CatalogEntityType.Model,
  'dial:catalogDisplayName': 'Model card',
};

const agentCard: CatalogSchemaOption = {
  $id: 'https://host/agent-card',
  'dial:catalogEntityType': CatalogEntityType.Agent,
  'dial:catalogDisplayName': 'Agent card',
};

const skillCard: CatalogSchemaOption = {
  $id: 'https://host/skill-card',
  'dial:catalogEntityType': CatalogEntityType.Skill,
  'dial:catalogDisplayName': 'Skill card',
};

/** Core's listing copies `dial:catalogEntityType` unconditionally, so an absent one arrives null. */
const kindless: CatalogSchemaOption = {
  $id: 'https://host/kindless-card',
  'dial:catalogEntityType': null,
  'dial:catalogDisplayName': 'Kindless card',
};

const undeclared: CatalogSchemaOption = {
  $id: 'https://host/undeclared-card',
  'dial:catalogDisplayName': 'Undeclared card',
};

describe('filterCatalogSchemaOptionsByEntityType', () => {
  test('keeps the schemas written for the given entity kind', () => {
    const result = filterCatalogSchemaOptionsByEntityType([modelCard, agentCard], CatalogEntityType.Model);

    expect(result).toEqual([modelCard]);
  });

  test('drops a schema written for another entity kind', () => {
    const result = filterCatalogSchemaOptionsByEntityType([modelCard, agentCard], CatalogEntityType.Agent);

    expect(result).toEqual([agentCard]);
  });

  test('keeps a schema whose entity kind is null', () => {
    const result = filterCatalogSchemaOptionsByEntityType([agentCard, kindless], CatalogEntityType.Model);

    expect(result).toEqual([kindless]);
  });

  test('keeps a schema that declares no entity kind at all', () => {
    const result = filterCatalogSchemaOptionsByEntityType([agentCard, undeclared], CatalogEntityType.Model);

    expect(result).toEqual([undeclared]);
  });

  test('keeps the currently selected schema even when its kind does not match', () => {
    const result = filterCatalogSchemaOptionsByEntityType(
      [modelCard, agentCard],
      CatalogEntityType.Model,
      agentCard.$id,
    );

    expect(result).toEqual([modelCard, agentCard]);
  });

  test('keeps a selected schema whose kind the console no longer offers', () => {
    const result = filterCatalogSchemaOptionsByEntityType(
      [modelCard, skillCard],
      CatalogEntityType.Model,
      skillCard.$id,
    );

    expect(result).toEqual([modelCard, skillCard]);
  });

  test('returns every option unchanged when given no entity kind', () => {
    const options = [modelCard, agentCard, skillCard];

    expect(filterCatalogSchemaOptionsByEntityType(options, undefined)).toBe(options);
  });

  test('returns an empty list when nothing matches', () => {
    const result = filterCatalogSchemaOptionsByEntityType([agentCard], CatalogEntityType.Interceptor);

    expect(result).toEqual([]);
  });

  test('does not mutate the list it is given', () => {
    const options = [modelCard, agentCard];

    filterCatalogSchemaOptionsByEntityType(options, CatalogEntityType.Model);

    expect(options).toEqual([modelCard, agentCard]);
  });
});
