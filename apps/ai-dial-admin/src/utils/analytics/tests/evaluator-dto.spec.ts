import { describe, expect, test } from 'vitest';

import { CreateEvaluatorDto, Evaluator, EvaluatorPreset, EvaluatorType } from '@/src/models/analytics/evaluator';
import {
  buildEvaluatorDto,
  isEvaluatorShapeValid,
  toEvaluatorDraft,
  toEvaluatorOutputs,
  toParamRows,
  toParams,
} from '@/src/utils/analytics/evaluator-dto';

const llm: Evaluator = {
  name: 'conversation-insights',
  version: 4,
  type: EvaluatorType.Llm,
  preset: EvaluatorPreset.ChatCompletion,
  model: 'gemini-2.5-flash-lite',
  params: { max_tokens: 700 },
  request_template: '{"messages":[]}',
  outputs: [{ name: 'topic', prose: 'One to three lowercase words.' }],
  created_at: '2026-08-19T10:00:00Z',
};

// Registered before the service replaced the three declaration members with `outputs`, and served as
// written: the console is the only place both shapes meet.
const supersededLlm: Evaluator = {
  name: 'session-insights',
  version: 6,
  type: EvaluatorType.Llm,
  model: 'gemini-2.5-flash-lite',
  response_schema: {
    type: 'object',
    properties: {
      risk_level: { type: 'string', description: 'Severity derived from the two fields above.', enum: ['low', 'high'] },
      topic: { type: 'string', description: 'One to three lowercase words.' },
    },
  },
  input_vars: [{ name: 'request', type: 'string' }],
  output_vars: [
    { name: 'topic', type: 'string', jsonata: 'topic' },
    { name: 'risk_level', type: 'string' },
  ],
  created_at: '2026-08-19T10:00:00Z',
};

const supersededSql: Evaluator = {
  name: 'usage-client-identity',
  version: 2,
  type: EvaluatorType.Sql,
  output_vars: [{ name: 'session_id', type: 'string', sql: "json_extract_string(tags, 'id')" }],
  created_at: '2026-08-19T10:00:00Z',
};

const draftOf = (evaluator: Evaluator): CreateEvaluatorDto => toEvaluatorDraft(evaluator);

describe('toEvaluatorOutputs', () => {
  test('reads the current member when the version carries one', () => {
    expect(toEvaluatorOutputs(llm)).toEqual([{ name: 'topic', prose: 'One to three lowercase words.' }]);
  });

  test('rebuilds a superseded sql version from its output variables', () => {
    expect(toEvaluatorOutputs(supersededSql)).toEqual([{ name: 'session_id', sql: "json_extract_string(tags, 'id')" }]);
  });

  test('composes a superseded llm version from its output variables and stored schema', () => {
    expect(toEvaluatorOutputs(supersededLlm)).toEqual([
      { name: 'topic', prose: 'One to three lowercase words.', values: undefined, jsonata: 'topic' },
      {
        name: 'risk_level',
        prose: 'Severity derived from the two fields above.',
        values: ['low', 'high'],
        jsonata: undefined,
      },
    ]);
  });

  test('takes the order from the output variables, not from the stored schema', () => {
    // The schema is stored as a JSON object, whose key order the store assigns rather than the author —
    // which is what put a derived field ahead of the fields it derives itself from.
    expect(toEvaluatorOutputs(supersededLlm).map((output) => output.name)).toEqual(['topic', 'risk_level']);
  });

  test('leaves prose empty when neither shape carries it', () => {
    const withoutDescription = { ...supersededLlm, response_schema: { type: 'object', properties: {} } };

    expect(toEvaluatorOutputs(withoutDescription)[0].prose).toBeUndefined();
  });
});

describe('toEvaluatorDraft', () => {
  test('drops the members the service assigns', () => {
    const draft = draftOf(llm);

    expect(draft).not.toHaveProperty('version');
    expect(draft).not.toHaveProperty('created_at');
    expect(draft.name).toBe('conversation-insights');
  });

  test('drops the superseded members rather than carrying them to a save', () => {
    const draft = draftOf(supersededLlm);

    ['output_vars', 'input_vars', 'response_schema'].forEach((key) => expect(draft).not.toHaveProperty(key));
    expect(draft.outputs).toHaveLength(2);
  });
});

describe('buildEvaluatorDto', () => {
  test('resubmits an unchanged llm version whole, keyed by output name', () => {
    expect(buildEvaluatorDto(draftOf(llm))).toEqual({
      name: 'conversation-insights',
      type: EvaluatorType.Llm,
      preset: EvaluatorPreset.ChatCompletion,
      model: 'gemini-2.5-flash-lite',
      params: { max_tokens: 700 },
      request_template: '{"messages":[]}',
      outputs: { topic: { prose: 'One to three lowercase words.' } },
    });
  });

  test('sends a sql output as a bare expression rather than an object', () => {
    expect(buildEvaluatorDto(draftOf(supersededSql)).outputs).toEqual({
      session_id: "json_extract_string(tags, 'id')",
    });
  });

  test('registers a version seeded from a superseded one in the current shape', () => {
    const dto = buildEvaluatorDto(draftOf(supersededLlm));

    ['output_vars', 'input_vars', 'response_schema'].forEach((key) => expect(dto).not.toHaveProperty(key));
    expect(dto.outputs).toEqual({
      topic: { prose: 'One to three lowercase words.', jsonata: 'topic' },
      risk_level: { prose: 'Severity derived from the two fields above.', values: ['low', 'high'] },
    });
  });

  test('carries a recorded preset through even though no control presents it', () => {
    expect(buildEvaluatorDto(draftOf(llm)).preset).toBe(EvaluatorPreset.ChatCompletion);
  });

  test('drops every member a sql evaluator forbids when the type is switched to sql', () => {
    const dto = buildEvaluatorDto({ ...draftOf(llm), type: EvaluatorType.Sql });

    // The service answers 422 for a member belonging to the other branch rather than ignoring it.
    expect(dto).toEqual({
      name: 'conversation-insights',
      type: EvaluatorType.Sql,
      outputs: { topic: 'One to three lowercase words.' },
    });
  });

  test('drops an output carrying no name', () => {
    const dto = buildEvaluatorDto({ ...draftOf(llm), outputs: [{ name: '', prose: 'stranded' }] });

    expect(dto.outputs).toEqual({});
  });

  test('carries a member the console does not present', () => {
    const dto = buildEvaluatorDto({ ...draftOf(llm), unknown_member: 'kept' } as CreateEvaluatorDto);

    expect(dto).toHaveProperty('unknown_member', 'kept');
  });
});

describe('isEvaluatorShapeValid', () => {
  test('accepts an llm version carrying a model and one output with prose', () => {
    expect(isEvaluatorShapeValid(draftOf(llm))).toBe(true);
  });

  test('refuses an llm version with no model', () => {
    expect(isEvaluatorShapeValid({ ...draftOf(llm), model: '' })).toBe(false);
  });

  test('refuses a version declaring no output', () => {
    expect(isEvaluatorShapeValid({ ...draftOf(llm), outputs: [] })).toBe(false);
  });

  test('refuses an output carrying no text', () => {
    expect(isEvaluatorShapeValid({ ...draftOf(llm), outputs: [{ name: 'topic' }] })).toBe(false);
  });

  test('refuses two outputs sharing a name, which the wire shape would collapse', () => {
    const draft = {
      ...draftOf(llm),
      outputs: [
        { name: 'topic', prose: 'first' },
        { name: 'topic', prose: 'second' },
      ],
    };

    expect(isEvaluatorShapeValid(draft)).toBe(false);
  });

  test('accepts a sql version whose outputs each carry an expression', () => {
    expect(isEvaluatorShapeValid(draftOf(supersededSql))).toBe(true);
  });

  test('refuses a sql output with no expression', () => {
    const draft = { ...draftOf(supersededSql), outputs: [{ name: 'session_id' }] };

    expect(isEvaluatorShapeValid(draft)).toBe(false);
  });
});

describe('toParamRows / toParams', () => {
  test('round-trips a numeric param as a number', () => {
    const rows = toParamRows({ max_tokens: 700, model_hint: 'fast' });

    expect(toParams(rows)).toEqual({ max_tokens: 700, model_hint: 'fast' });
  });

  test('drops a blank key rather than registering it', () => {
    expect(toParams([{ id: '1', key: '  ', value: 'x' }])).toEqual({});
  });

  test('reads no params as an empty map', () => {
    expect(toParamRows()).toEqual([]);
  });
});
