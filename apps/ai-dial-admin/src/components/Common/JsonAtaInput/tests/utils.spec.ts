import { describe, test, expect } from 'vitest';
import { JSONSchema7 } from 'json-schema';

import { schemaToTreeNodes, SchemaTreeNode } from '@/src/components/Common/SchemaGrid/utils';
import { getSchemaSuggestions } from '../utils';

const buildNodes = (schema: JSONSchema7): SchemaTreeNode[] => schemaToTreeNodes(schema, '', schema);

const flatSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    count: { type: 'integer' },
    active: { type: 'boolean' },
  },
};

const nestedObjectSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    address: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        zip: { type: 'string' },
        city: { type: 'string' },
      },
    },
  },
};

const arraySchema: JSONSchema7 = {
  type: 'object',
  properties: {
    choices: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          index: { type: 'integer' },
        },
      },
    },
  },
};

const deepSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    choices: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          message: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              role: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

describe('getSchemaSuggestions', () => {
  describe('empty expression', () => {
    test('should return top-level properties for empty string', () => {
      const nodes = buildNodes(flatSchema);
      const suggestions = getSchemaSuggestions(nodes, '');

      expect(suggestions).toHaveLength(3);
      expect(suggestions.map((s) => s.label)).toEqual(['id', 'count', 'active']);
      expect(suggestions.map((s) => s.value)).toEqual(['id', 'count', 'active']);
      expect(suggestions.map((s) => s.type)).toEqual(['string', 'integer', 'boolean']);
    });

    test('should return top-level properties for whitespace-only string', () => {
      const nodes = buildNodes(flatSchema);
      const suggestions = getSchemaSuggestions(nodes, '   ');

      expect(suggestions).toHaveLength(3);
      expect(suggestions.map((s) => s.label)).toEqual(['id', 'count', 'active']);
    });

    test('should return empty array when schema has no properties', () => {
      const nodes = buildNodes({ type: 'object' });
      const suggestions = getSchemaSuggestions(nodes, '');

      expect(suggestions).toEqual([]);
    });
  });

  describe('ends with dot – drill into object children', () => {
    test('should show children of a nested object after dot', () => {
      const nodes = buildNodes(nestedObjectSchema);
      const suggestions = getSchemaSuggestions(nodes, 'address.');

      expect(suggestions).toHaveLength(3);
      expect(suggestions.map((s) => s.label)).toEqual(['street', 'zip', 'city']);
      expect(suggestions.map((s) => s.value)).toEqual(['address.street', 'address.zip', 'address.city']);
    });

    test('should return empty when path before dot does not exist', () => {
      const nodes = buildNodes(nestedObjectSchema);
      const suggestions = getSchemaSuggestions(nodes, 'nonexistent.');

      expect(suggestions).toEqual([]);
    });

    test('should return empty when node has no children', () => {
      const nodes = buildNodes(flatSchema);
      const suggestions = getSchemaSuggestions(nodes, 'id.');

      expect(suggestions).toEqual([]);
    });

    test('should show children of deeply nested object', () => {
      const nodes = buildNodes(deepSchema);
      const suggestions = getSchemaSuggestions(nodes, 'choices[0].message.');

      expect(suggestions).toHaveLength(2);
      expect(suggestions.map((s) => s.label)).toEqual(['content', 'role']);
      expect(suggestions.map((s) => s.value)).toEqual(['choices[0].message.content', 'choices[0].message.role']);
    });
  });

  describe('ends with bracket – drill into array item properties', () => {
    test('should show array item properties after []', () => {
      const nodes = buildNodes(arraySchema);
      const suggestions = getSchemaSuggestions(nodes, 'choices[]');

      expect(suggestions).toHaveLength(2);
      expect(suggestions.map((s) => s.label)).toEqual(['message', 'index']);
      expect(suggestions.map((s) => s.value)).toEqual(['choices[].message', 'choices[].index']);
    });

    test('should show array item properties after [0]', () => {
      const nodes = buildNodes(arraySchema);
      const suggestions = getSchemaSuggestions(nodes, 'choices[0]');

      expect(suggestions).toHaveLength(2);
      expect(suggestions.map((s) => s.label)).toEqual(['message', 'index']);
      expect(suggestions.map((s) => s.value)).toEqual(['choices[0].message', 'choices[0].index']);
    });

    test('should return empty when array path does not exist', () => {
      const nodes = buildNodes(arraySchema);
      const suggestions = getSchemaSuggestions(nodes, 'nonexistent[]');

      expect(suggestions).toEqual([]);
    });

    test('should return empty when node is not an array', () => {
      const nodes = buildNodes(nestedObjectSchema);
      const suggestions = getSchemaSuggestions(nodes, 'address[]');

      expect(suggestions).toEqual([]);
    });

    test('should return empty when array has no object item children', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          tags: { type: 'array', items: { type: 'string' } },
        },
      };
      const nodes = buildNodes(schema);
      const suggestions = getSchemaSuggestions(nodes, 'tags[]');

      expect(suggestions).toEqual([]);
    });

    test('should return empty when expression ends with ] but has no opening bracket', () => {
      const nodes = buildNodes(arraySchema);
      const suggestions = getSchemaSuggestions(nodes, 'choices]');

      expect(suggestions).toEqual([]);
    });
  });

  describe('partial text – filter top-level', () => {
    test('should filter top-level properties by partial match', () => {
      const nodes = buildNodes(flatSchema);
      const suggestions = getSchemaSuggestions(nodes, 'co');

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toMatchObject({ label: 'count', value: 'count', type: 'integer' });
    });

    test('should be case-insensitive when filtering', () => {
      const nodes = buildNodes(flatSchema);
      const suggestions = getSchemaSuggestions(nodes, 'ID');

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toMatchObject({ label: 'id', value: 'id' });
    });

    test('should return empty when no top-level property matches', () => {
      const nodes = buildNodes(flatSchema);
      const suggestions = getSchemaSuggestions(nodes, 'xyz');

      expect(suggestions).toEqual([]);
    });

    test('should match substring not just prefix', () => {
      const nodes = buildNodes(flatSchema);
      const suggestions = getSchemaSuggestions(nodes, 'tiv');

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toMatchObject({ label: 'active' });
    });
  });

  describe('partial text – filter nested level', () => {
    test('should filter children of a nested object by partial match', () => {
      const nodes = buildNodes(nestedObjectSchema);
      const suggestions = getSchemaSuggestions(nodes, 'address.str');

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toMatchObject({
        label: 'street',
        value: 'address.street',
        type: 'string',
      });
    });

    test('should filter case-insensitively at nested level', () => {
      const nodes = buildNodes(nestedObjectSchema);
      const suggestions = getSchemaSuggestions(nodes, 'address.ZIP');

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toMatchObject({ label: 'zip', value: 'address.zip' });
    });

    test('should return empty when nested parent does not exist', () => {
      const nodes = buildNodes(nestedObjectSchema);
      const suggestions = getSchemaSuggestions(nodes, 'fake.str');

      expect(suggestions).toEqual([]);
    });

    test('should return all children when partial is empty after dot', () => {
      const nodes = buildNodes(nestedObjectSchema);
      // This triggers the "ends with dot" path
      const suggestions = getSchemaSuggestions(nodes, 'address.');

      expect(suggestions).toHaveLength(3);
    });

    test('should filter deeply nested children by partial match', () => {
      const nodes = buildNodes(deepSchema);
      const suggestions = getSchemaSuggestions(nodes, 'choices[0].message.con');

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toMatchObject({
        label: 'content',
        value: 'choices[0].message.content',
        type: 'string',
      });
    });
  });

  describe('schemas with $ref', () => {
    test('should resolve $ref and provide suggestions', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          profile: { $ref: '#/$defs/Profile' },
          id: { type: 'string' },
        },
        $defs: {
          Profile: {
            type: 'object',
            properties: {
              displayName: { type: 'string' },
              age: { type: 'integer' },
            },
          },
        },
      };
      const nodes = buildNodes(schema);

      const topLevel = getSchemaSuggestions(nodes, '');
      expect(topLevel).toHaveLength(2);
      expect(topLevel.map((s) => s.label)).toEqual(['profile', 'id']);

      const profileChildren = getSchemaSuggestions(nodes, 'profile.');
      expect(profileChildren).toHaveLength(2);
      expect(profileChildren.map((s) => s.label)).toEqual(['displayName', 'age']);
    });
  });

  describe('schemas with anyOf/oneOf', () => {
    test('should derive type from anyOf and drill into object children', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          config: {
            oneOf: [
              {
                type: 'object',
                properties: {
                  timeout: { type: 'number' },
                  retries: { type: 'integer' },
                },
              },
              { type: 'null' },
            ],
          },
        },
      };
      const nodes = buildNodes(schema);

      const topLevel = getSchemaSuggestions(nodes, '');
      expect(topLevel).toHaveLength(1);
      expect(topLevel[0]).toMatchObject({ label: 'config', type: 'object' });

      const children = getSchemaSuggestions(nodes, 'config.');
      expect(children).toHaveLength(2);
      expect(children.map((s) => s.label)).toEqual(['timeout', 'retries']);
    });
  });

  describe('complex navigation flow', () => {
    test('should support full drill-down: top level → object → array → nested object', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    details: {
                      type: 'object',
                      properties: {
                        score: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };
      const nodes = buildNodes(schema);

      // Step 1: empty → top level
      const step1 = getSchemaSuggestions(nodes, '');
      expect(step1).toHaveLength(1);
      expect(step1[0]).toMatchObject({ label: 'data', type: 'object' });

      // Step 2: data. → object children
      const step2 = getSchemaSuggestions(nodes, 'data.');
      expect(step2).toHaveLength(1);
      expect(step2[0]).toMatchObject({ label: 'items', type: 'array' });

      // Step 3: data.items[] → array item props
      const step3 = getSchemaSuggestions(nodes, 'data.items[]');
      expect(step3).toHaveLength(2);
      expect(step3.map((s) => s.label)).toEqual(['name', 'details']);

      // Step 4: data.items[].details. → nested object children
      const step4 = getSchemaSuggestions(nodes, 'data.items[].details.');
      expect(step4).toHaveLength(1);
      expect(step4[0]).toMatchObject({
        label: 'score',
        value: 'data.items[].details.score',
        type: 'number',
      });
    });
  });

  describe('edge cases', () => {
    test('should return empty for non-object root schema', () => {
      const nodes = buildNodes({ type: 'string' } as JSONSchema7);
      const suggestions = getSchemaSuggestions(nodes, '');

      expect(suggestions).toEqual([]);
    });

    test('should handle expression with only a dot', () => {
      const nodes = buildNodes(flatSchema);
      const suggestions = getSchemaSuggestions(nodes, '.');

      expect(suggestions).toEqual([]);
    });

    test('should handle empty tree nodes', () => {
      const suggestions = getSchemaSuggestions([], '');
      expect(suggestions).toEqual([]);

      const suggestions2 = getSchemaSuggestions([], 'something.');
      expect(suggestions2).toEqual([]);
    });

    test('should handle array with numeric index in brackets', () => {
      const nodes = buildNodes(arraySchema);
      const suggestions = getSchemaSuggestions(nodes, 'choices[5]');

      expect(suggestions).toHaveLength(2);
      expect(suggestions.map((s) => s.label)).toEqual(['message', 'index']);
    });
  });
});
