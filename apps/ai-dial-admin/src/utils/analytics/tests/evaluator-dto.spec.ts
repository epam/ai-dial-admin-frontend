import { describe, expect, test } from 'vitest';

import { CreateEvaluatorDto, Evaluator, EvaluatorPreset, EvaluatorType } from '@/src/models/analytics/evaluator';
import {
  buildEvaluatorDto,
  isEvaluatorShapeValid,
  toEvaluatorDraft,
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
  response_schema: { type: 'object' },
  input_vars: [{ name: 'members', type: 'string', jsonata: '$join(members)' }],
  output_vars: [{ name: 'topic', type: 'string', jsonata: 'insights.topic' }],
  created_at: '2026-08-19T10:00:00Z',
};

const sql: Evaluator = {
  name: 'usage-client-identity',
  version: 2,
  type: EvaluatorType.Sql,
  output_vars: [{ name: 'session_id', type: 'string', sql: "json_extract_string(tags, 'id')" }],
  created_at: '2026-08-19T10:00:00Z',
};

const draftOf = (evaluator: Evaluator): CreateEvaluatorDto => toEvaluatorDraft(evaluator);

describe('toEvaluatorDraft', () => {
  test('drops the members the service assigns', () => {
    const draft = draftOf(llm) as Record<string, unknown>;

    expect(draft.version).toBeUndefined();
    expect(draft.created_at).toBeUndefined();
    expect(draft.name).toBe('conversation-insights');
  });
});

describe('buildEvaluatorDto', () => {
  test('resubmits an unchanged llm version whole', () => {
    expect(buildEvaluatorDto(draftOf(llm))).toEqual({
      name: 'conversation-insights',
      type: EvaluatorType.Llm,
      preset: EvaluatorPreset.ChatCompletion,
      model: 'gemini-2.5-flash-lite',
      params: { max_tokens: 700 },
      request_template: '{"messages":[]}',
      response_schema: { type: 'object' },
      input_vars: [{ name: 'members', type: 'string', jsonata: '$join(members)' }],
      output_vars: [{ name: 'topic', type: 'string', jsonata: 'insights.topic' }],
    });
  });

  test('drops every member a sql evaluator forbids when the type is switched to sql', () => {
    const dto = buildEvaluatorDto({ ...draftOf(llm), type: EvaluatorType.Sql });

    // The service answers 422 for a member belonging to the other branch rather than ignoring it.
    expect(dto).toEqual({
      name: 'conversation-insights',
      type: EvaluatorType.Sql,
      output_vars: [{ name: 'topic', type: 'string', sql: 'insights.topic' }],
    });
  });

  test('moves an expression from sql to jsonata when the type is switched to llm', () => {
    const dto = buildEvaluatorDto({
      ...draftOf(sql),
      type: EvaluatorType.Llm,
      preset: EvaluatorPreset.ChatCompletion,
      model: 'gpt-4o',
    });

    expect(dto.output_vars).toEqual([
      { name: 'session_id', type: 'string', jsonata: "json_extract_string(tags, 'id')" },
    ]);
  });

  test('moves an expression from jsonata to sql when the type is switched to sql', () => {
    const dto = buildEvaluatorDto({ ...draftOf(llm), type: EvaluatorType.Sql });

    expect(dto.output_vars).toEqual([{ name: 'topic', type: 'string', sql: 'insights.topic' }]);
  });

  test('sends the name exactly as stored', () => {
    // Trimming would post a different name, which registers a separate evaluator — the one thing the
    // read-only name field exists to prevent.
    expect(buildEvaluatorDto({ ...draftOf(llm), name: '  spaced  ' }).name).toBe('  spaced  ');
  });

  test('drops a variable row left unnamed', () => {
    const dto = buildEvaluatorDto({
      ...draftOf(llm),
      input_vars: [
        { name: 'members', type: 'string' },
        { name: '', type: 'string' },
      ],
      output_vars: [
        { name: 'topic', type: 'string' },
        { name: '   ', type: 'long' },
      ],
    });

    // `@NotBlank` on the var name rejects the whole request, not just the row.
    expect(dto.input_vars).toHaveLength(1);
    expect(dto.output_vars).toHaveLength(1);
  });

  test('omits a member cleared to nothing rather than sending it empty', () => {
    const dto = buildEvaluatorDto({ ...draftOf(llm), model: '', params: {}, input_vars: [] });

    expect(dto).not.toHaveProperty('model');
    expect(dto).not.toHaveProperty('params');
    expect(dto).not.toHaveProperty('input_vars');
  });

  test('keeps a stored type the option list does not offer', () => {
    const dto = buildEvaluatorDto({
      ...draftOf(sql),
      output_vars: [{ name: 'activity_day', type: 'datetime', sql: 'date_trunc(...)' }],
    });

    expect(dto.output_vars?.[0].type).toBe('datetime');
  });
});

describe('isEvaluatorShapeValid', () => {
  test('accepts a complete llm evaluator', () => {
    expect(isEvaluatorShapeValid(draftOf(llm))).toBe(true);
  });

  test('accepts a complete sql evaluator', () => {
    expect(isEvaluatorShapeValid(draftOf(sql))).toBe(true);
  });

  test('rejects an llm evaluator with no model', () => {
    expect(isEvaluatorShapeValid({ ...draftOf(llm), model: '' })).toBe(false);
  });

  test('rejects an llm evaluator with no preset', () => {
    expect(isEvaluatorShapeValid({ ...draftOf(llm), preset: undefined })).toBe(false);
  });

  test('accepts a preset the console does not name', () => {
    // The service only checks that one is present, so a stored value the enum lacks must stay submittable.
    expect(isEvaluatorShapeValid({ ...draftOf(llm), preset: 'future_preset' as EvaluatorPreset })).toBe(true);
  });

  test('rejects a sql output variable with no expression', () => {
    expect(isEvaluatorShapeValid({ ...draftOf(sql), output_vars: [{ name: 'session_id', type: 'string' }] })).toBe(
      false,
    );
  });

  test('rejects an evaluator declaring no output variable', () => {
    expect(isEvaluatorShapeValid({ ...draftOf(llm), output_vars: [] })).toBe(false);
  });

  test('rejects an output variable left unnamed', () => {
    expect(isEvaluatorShapeValid({ ...draftOf(llm), output_vars: [{ name: '', type: 'string' }] })).toBe(false);
  });
});

describe('params rows', () => {
  test('round-trips an entry', () => {
    expect(toParams(toParamRows({ max_tokens: 700, temperature: 0 }))).toEqual({ max_tokens: 700, temperature: 0 });
  });

  test('gives each row its own identity so two can share a key while being typed', () => {
    const rows = toParamRows({ a: 1, b: 2 });

    expect(new Set(rows.map((row) => row.id)).size).toBe(2);
  });

  test('drops a row whose key is blank', () => {
    expect(
      toParams([
        { id: '1', key: '', value: 'x' },
        { id: '2', key: 'max_tokens', value: '700' },
      ]),
    ).toEqual({
      max_tokens: 700,
    });
  });

  test('keeps a numeric value numeric', () => {
    expect(toParams([{ id: '1', key: 'temperature', value: '0.70' }])).toEqual({ temperature: 0.7 });
  });

  test('keeps a non-numeric value as text', () => {
    expect(toParams([{ id: '1', key: 'mode', value: 'strict' }])).toEqual({ mode: 'strict' });
  });
});
