import { describe, expect, test } from 'vitest';

import { PipelineTransform, TransformType } from '@/src/models/analytics/pipeline';
import { TransformDraft } from '@/src/models/analytics/pipeline-ui';
import {
  buildTransformDto,
  getOutputText,
  hasLegacyOutputs,
  isTransformValid,
  toParamRows,
  toParams,
  toTransformDraft,
  toTransformOutputs,
} from '@/src/utils/analytics/transform-dto';

const llmStored: PipelineTransform = {
  type: TransformType.Llm,
  model: 'gpt-4o',
  outputs: {
    title: 'Title of the session.',
    risk_level: { prose: 'Severity.', values: ['low', 'high'] },
  },
};

const legacyStored: PipelineTransform = {
  type: TransformType.Llm,
  model: 'gpt-4o',
  output_vars: [
    { name: 'title', type: 'string' },
    { name: 'risk_level', type: 'string', jsonata: 'level' },
  ],
  response_schema: {
    type: 'object',
    properties: {
      risk_level: { description: 'Severity.', enum: ['low', 'high'] },
      title: { description: 'Title of the session.' },
    },
  },
};

describe('Utils :: analytics :: toTransformOutputs', () => {
  test('reads the authored map in its stored order', () => {
    expect(toTransformOutputs(llmStored)).toEqual([
      { name: 'title', prose: 'Title of the session.' },
      { name: 'risk_level', prose: 'Severity.', values: ['low', 'high'], jsonata: undefined },
    ]);
  });

  test('reads an output stored with no refinement, which the service serves as null', () => {
    const transform: PipelineTransform = { type: TransformType.Llm, outputs: { title: null, sentiment: null } };

    expect(toTransformOutputs(transform)).toEqual([{ name: 'title' }, { name: 'sentiment' }]);
  });

  test('reads a bare string on a sql transform as the expression', () => {
    const transform: PipelineTransform = { type: TransformType.Sql, outputs: { total: 'count(*)' } };

    expect(toTransformOutputs(transform)).toEqual([{ name: 'total', sql: 'count(*)' }]);
  });

  test('rebuilds the entries of a declaration still stored in the superseded shape', () => {
    // The order comes from `output_vars`; the stored schema's key order is the store's, not the author's.
    expect(toTransformOutputs(legacyStored)).toEqual([
      { name: 'title', prose: 'Title of the session.', values: undefined, jsonata: undefined },
      { name: 'risk_level', prose: 'Severity.', values: ['low', 'high'], jsonata: 'level' },
    ]);
  });

  test('drops an identity transform, which means the same as declaring none', () => {
    const identity: PipelineTransform = {
      type: TransformType.Llm,
      model: 'gpt-4o',
      output_vars: [{ name: 'title', type: 'string', jsonata: 'title' }],
      response_schema: { type: 'object', properties: { title: { description: 'Title.' } } },
    };

    expect(toTransformOutputs(identity)).toEqual([
      { name: 'title', prose: 'Title.', values: undefined, jsonata: undefined },
    ]);
  });

  test('drops an identity transform authored in the current shape too', () => {
    const identity: PipelineTransform = {
      type: TransformType.Llm,
      model: 'gpt-4o',
      outputs: { topic: { prose: 'Topic.', jsonata: 'topic' } },
    };

    expect(toTransformOutputs(identity)).toEqual([
      { name: 'topic', prose: 'Topic.', values: undefined, jsonata: undefined },
    ]);
  });

  test('keeps a transform that reads the field under another name', () => {
    const renamed: PipelineTransform = {
      type: TransformType.Llm,
      model: 'gpt-4o',
      outputs: { topic: { prose: 'Topic.', jsonata: 'topic_raw' } },
    };

    expect(toTransformOutputs(renamed)[0].jsonata).toBe('topic_raw');
  });

  test('reports which declarations still carry the superseded shape', () => {
    expect(hasLegacyOutputs(legacyStored)).toBe(true);
    expect(hasLegacyOutputs(llmStored)).toBe(false);
    expect(hasLegacyOutputs(undefined)).toBe(false);
  });

  test('seeds a draft with the outputs as rows', () => {
    expect(toTransformDraft(llmStored).outputs).toHaveLength(2);
  });
});

describe('Utils :: analytics :: buildTransformDto', () => {
  const draft: TransformDraft = { ...llmStored, outputs: toTransformOutputs(llmStored) };

  test('keys the outputs by target column, in row order', () => {
    expect(buildTransformDto(draft).outputs).toEqual({
      title: 'Title of the session.',
      risk_level: { prose: 'Severity.', values: ['low', 'high'] },
    });
  });

  test('sends no prose for an output that declares none, which the column defaults', () => {
    const untouched: TransformDraft = { ...draft, outputs: [{ name: 'title' }] };

    expect(buildTransformDto(untouched).outputs).toEqual({ title: {} });
  });

  test('drops the llm-only members from a sql transform', () => {
    const sql: TransformDraft = {
      ...draft,
      type: TransformType.Sql,
      request_template: '{}',
      inputs: { request: { column: 'request_body' } },
      outputs: [{ name: 'total', sql: 'count(*)' }],
    };

    const dto = buildTransformDto(sql) as unknown as Record<string, unknown>;

    expect(dto.outputs).toEqual({ total: 'count(*)' });
    ['model', 'request_template', 'inputs', 'params'].forEach((key) => expect(dto).not.toHaveProperty(key));
  });

  test('trims a bound column name, which would otherwise bind to no column at all', () => {
    const spaced: TransformDraft = { ...draft, outputs: [{ name: '  title  ', prose: 'Title.' }] };

    expect(buildTransformDto(spaced).outputs).toEqual({ title: 'Title.' });
  });

  test('carries an untouched legacy declaration back unchanged rather than rewriting it', () => {
    const untouched = toTransformDraft(legacyStored);

    const dto = buildTransformDto(untouched, legacyStored) as unknown as Record<string, unknown>;

    expect(dto).not.toHaveProperty('outputs');
    expect(dto.output_vars).toEqual(legacyStored.output_vars);
    expect(dto.response_schema).toEqual(legacyStored.response_schema);
  });

  test('moves an edited legacy declaration to the current shape, dropping both superseded members', () => {
    const edited = toTransformDraft(legacyStored);
    edited.outputs = [{ name: 'title', prose: 'A different instruction.' }];

    const dto = buildTransformDto(edited, legacyStored) as unknown as Record<string, unknown>;

    expect(dto.outputs).toEqual({ title: 'A different instruction.' });
    expect(dto).not.toHaveProperty('output_vars');
    expect(dto).not.toHaveProperty('response_schema');
  });

  test('rewrites a legacy declaration whose type changed, both superseded members being llm-only', () => {
    const switched = { ...toTransformDraft(legacyStored), type: TransformType.Sql };

    const dto = buildTransformDto(switched, legacyStored) as unknown as Record<string, unknown>;

    expect(dto).not.toHaveProperty('output_vars');
    expect(dto).not.toHaveProperty('response_schema');
  });

  test('accepts the wire shape a JSON-edited document hands back', () => {
    const fromDocument = { ...draft, outputs: llmStored.outputs } as unknown as TransformDraft;

    expect(buildTransformDto(fromDocument).outputs).toEqual({
      title: 'Title of the session.',
      risk_level: { prose: 'Severity.', values: ['low', 'high'] },
    });
  });

  test('sends an output declaring both refinements as written, for the service to refuse', () => {
    const both = {
      ...draft,
      outputs: [{ name: 'title', prose: 'Title.', values: ['a'], jsonata: 'level' }],
    } as TransformDraft;

    expect(buildTransformDto(both).outputs).toEqual({
      title: { prose: 'Title.', values: ['a'], jsonata: 'level' },
    });
  });

  test('reads a document whose outputs are neither shape as declaring none', () => {
    const broken = { ...draft, outputs: 'x' } as unknown as TransformDraft;

    expect(buildTransformDto(broken).outputs).toEqual({});
  });
});

describe('Utils :: analytics :: isTransformValid', () => {
  const llm: TransformDraft = {
    type: TransformType.Llm,
    model: 'gpt-4o',
    request_template: '{"messages":[]}',
    outputs: [{ name: 'title' }],
  };

  test('accepts an llm transform whose output declares no prose', () => {
    expect(isTransformValid(llm)).toBe(true);
  });

  test('refuses a transform with no type, no output, or a duplicate column', () => {
    expect(isTransformValid(undefined)).toBe(false);
    expect(isTransformValid({ ...llm, outputs: [] })).toBe(false);
    expect(isTransformValid({ ...llm, outputs: [{ name: 'title' }, { name: 'title' }] })).toBe(false);
  });

  test('refuses an llm transform with no model', () => {
    expect(isTransformValid({ ...llm, model: undefined })).toBe(false);
  });

  // The service runs this as a shape check on every write; only the placeholder correspondence is
  // deferred to enable.
  test('refuses an llm transform with no request template', () => {
    expect(isTransformValid({ ...llm, request_template: undefined })).toBe(false);
    expect(isTransformValid({ ...llm, request_template: '   ' })).toBe(false);
  });

  test('requires no template of a sql transform, which renders no request', () => {
    expect(isTransformValid({ type: TransformType.Sql, outputs: [{ name: 'total', sql: 'count(*)' }] })).toBe(true);
  });

  test('requires every sql output to carry an expression, and no model', () => {
    const sql: TransformDraft = { type: TransformType.Sql, outputs: [{ name: 'total', sql: 'count(*)' }] };

    expect(isTransformValid(sql)).toBe(true);
    expect(isTransformValid({ ...sql, outputs: [{ name: 'total' }] })).toBe(false);
  });
});

describe('Utils :: analytics :: getOutputText', () => {
  test('reads the member the type uses, falling back to the other so a type change moves it', () => {
    expect(getOutputText({ name: 'x', sql: 'count(*)' }, TransformType.Sql)).toBe('count(*)');
    expect(getOutputText({ name: 'x', prose: 'Severity.' }, TransformType.Sql)).toBe('Severity.');
    expect(getOutputText({ name: 'x' }, TransformType.Llm)).toBe('');
  });
});

describe('Utils :: analytics :: params', () => {
  test('reads params into rows and writes them back, typing what round-trips as a number', () => {
    const rows = toParamRows({ max_tokens: 512, stop: 'END' });

    expect(rows.map((row) => row.key)).toEqual(['max_tokens', 'stop']);
    expect(toParams(rows)).toEqual({ max_tokens: 512, stop: 'END' });
  });

  test('drops a blank key rather than registering one that cannot be addressed', () => {
    expect(toParams([{ id: '1', key: '  ', value: 'x' }])).toEqual({});
  });
});
