import { describe, expect, test } from 'vitest';

import { buildEntityScope, getEntityDeploymentName } from '@/src/components/Analytics/Usage/utils/entity-scope';
import { QueryExprType, QueryOperator, QueryValueType } from '@/src/models/analytics/query';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { ApplicationRoute } from '@/src/types/routes';

const columnIs = (column: string, name: string) => ({
  op: QueryOperator.Eq,
  args: [
    { type: QueryExprType.Field, name: column },
    { type: QueryExprType.Value, value_type: QueryValueType.String, value: name },
  ],
});

const asset = (path: string) => ({ name: 'ignored', path }) as BaseEntity;

describe('getEntityDeploymentName', () => {
  test.each([ApplicationRoute.Models, ApplicationRoute.PlatformModels, ApplicationRoute.Toolsets])(
    'names a %s entity by its name',
    (route) => {
      expect(getEntityDeploymentName(route, { name: 'gpt-4o' })).toBe('gpt-4o');
    },
  );

  test('names an asset toolset by its kind and its path, each segment encoded', () => {
    expect(getEntityDeploymentName(ApplicationRoute.AssetsToolsets, asset('bucket/QA editor__0.0.1'))).toBe(
      'toolsets/bucket/QA%20editor__0.0.1',
    );
  });

  test('names an asset application the same way, under its own kind', () => {
    expect(getEntityDeploymentName(ApplicationRoute.AssetsApplications, asset('public/My app__1.0.0'))).toBe(
      'applications/public/My%20app__1.0.0',
    );
  });

  test('names nothing for an entity with no name, or an asset with no path', () => {
    expect(getEntityDeploymentName(ApplicationRoute.Models, {})).toBeNull();
    expect(getEntityDeploymentName(ApplicationRoute.AssetsToolsets, { name: 'x' })).toBeNull();
    expect(getEntityDeploymentName(ApplicationRoute.Models)).toBeNull();
  });
});

describe('buildEntityScope', () => {
  test("reads a model's own rows and no others", () => {
    expect(buildEntityScope(ApplicationRoute.Models, 'gpt-4o')).toEqual({
      own: [columnIs('deployment', 'gpt-4o')],
    });
  });

  test('reads an application by the calls made to it, and by its call tree two ways', () => {
    const scopeOfApp = buildEntityScope(ApplicationRoute.Applications, 'rag');
    const isTrue = (call: object) => ({
      op: QueryOperator.Eq,
      args: [call, { type: QueryExprType.Value, value_type: QueryValueType.Boolean, value: 'true' }],
    });
    const inTree = isTrue({
      type: QueryExprType.Fn,
      name: 'array_has',
      args: [
        { type: QueryExprType.Field, name: 'execution_path' },
        { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'rag' },
      ],
    });

    expect(scopeOfApp?.own).toEqual([columnIs('deployment', 'rag')]);
    // The priced model calls anywhere below it: what its money, tokens and models count.
    expect(scopeOfApp?.made).toEqual([
      inTree,
      isTrue({
        type: QueryExprType.Fn,
        name: 'not_empty',
        args: [
          {
            type: QueryExprType.Fn,
            name: 'to_string',
            args: [{ type: QueryExprType.Field, name: 'deployment_price' }],
          },
        ],
      }),
    ]);
    // The tool calls anywhere below it, less the calls to tools the application serves itself.
    expect(scopeOfApp?.tools).toEqual([
      inTree,
      {
        op: QueryOperator.Ne,
        args: [
          { type: QueryExprType.Field, name: 'deployment' },
          { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'rag' },
        ],
      },
    ]);
  });

  test('gives a toolset no call tree', () => {
    expect(buildEntityScope(ApplicationRoute.Toolsets, 'search')).toEqual({ own: [columnIs('deployment', 'search')] });
  });

  test('gives no scope where there is no name to match, rather than the whole log', () => {
    expect(buildEntityScope(ApplicationRoute.Models, null)).toBeNull();
  });
});
