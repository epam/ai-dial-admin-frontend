import { act, renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { useCreateEvaluatorForm } from '@/src/components/Analytics/Evaluators/use-create-evaluator-form';
import { CreateEvaluatorDto, EvaluatorType } from '@/src/models/analytics/evaluator';

const renderForm = (existingNames: string[] = []) => renderHook(() => useCreateEvaluatorForm({ existingNames }));

const validOutputVar = { name: 'topic', type: 'string' };

describe('useCreateEvaluatorForm — initial state', () => {
  test('starts as an llm draft with no name and no output variables', () => {
    const { result } = renderForm();

    expect(result.current.draft).toEqual<CreateEvaluatorDto>({ name: '', type: EvaluatorType.Llm, output_vars: [] });
    expect(result.current.nameError).toBeNull();
    expect(result.current.isValid).toBe(false);
  });
});

describe('useCreateEvaluatorForm — onChange', () => {
  test('merges a patch rather than replacing the draft', () => {
    const { result } = renderForm();

    act(() => result.current.onChange({ name: 'conversation-insights' }));
    act(() => result.current.onChange({ model: 'gpt-4o' }));

    expect(result.current.draft.name).toBe('conversation-insights');
    expect(result.current.draft.model).toBe('gpt-4o');
  });

  test('flipping the type back restores what was typed for the other type', () => {
    const { result } = renderForm();

    act(() => result.current.onChange({ model: 'gpt-4o', preset: undefined }));
    act(() => result.current.onChange({ type: EvaluatorType.Sql }));
    act(() => result.current.onChange({ type: EvaluatorType.Llm }));

    expect(result.current.draft.model).toBe('gpt-4o');
  });
});

describe('useCreateEvaluatorForm — isValid: an llm evaluator requires a preset and a model', () => {
  test('is invalid while the model is blank, even with a preset and an output variable', () => {
    const { result } = renderForm();

    act(() =>
      result.current.onChange({
        name: 'conversation-insights',
        preset: 'chat_completion' as CreateEvaluatorDto['preset'],
        output_vars: [validOutputVar],
      }),
    );

    expect(result.current.isValid).toBe(false);
  });

  test('is invalid while the preset is unset, even with a model and an output variable', () => {
    const { result } = renderForm();

    act(() =>
      result.current.onChange({ name: 'conversation-insights', model: 'gpt-4o', output_vars: [validOutputVar] }),
    );

    expect(result.current.isValid).toBe(false);
  });

  test('is valid once the name, preset, model, and one named typed output variable are all set', () => {
    const { result } = renderForm();

    act(() =>
      result.current.onChange({
        name: 'conversation-insights',
        preset: 'chat_completion' as CreateEvaluatorDto['preset'],
        model: 'gpt-4o',
        output_vars: [validOutputVar],
      }),
    );

    expect(result.current.isValid).toBe(true);
  });
});

describe('useCreateEvaluatorForm — isValid: at least one output variable is required for either type', () => {
  test('is invalid for llm with no output variable declared', () => {
    const { result } = renderForm();

    act(() =>
      result.current.onChange({
        name: 'conversation-insights',
        preset: 'chat_completion' as CreateEvaluatorDto['preset'],
        model: 'gpt-4o',
      }),
    );

    expect(result.current.isValid).toBe(false);
  });

  test('is invalid for sql with no output variable declared', () => {
    const { result } = renderForm();

    act(() => result.current.onChange({ name: 'row-count', type: EvaluatorType.Sql }));

    expect(result.current.isValid).toBe(false);
  });
});

describe('useCreateEvaluatorForm — isValid: a sql output variable requires its expression', () => {
  test('is invalid when the output variable has a name and a type but no expression', () => {
    const { result } = renderForm();

    act(() =>
      result.current.onChange({
        name: 'row-count',
        type: EvaluatorType.Sql,
        output_vars: [{ name: 'total', type: 'long' }],
      }),
    );

    expect(result.current.isValid).toBe(false);
  });

  test('is valid once that output variable also carries an expression', () => {
    const { result } = renderForm();

    act(() =>
      result.current.onChange({
        name: 'row-count',
        type: EvaluatorType.Sql,
        output_vars: [{ name: 'total', type: 'long', sql: 'count(*)' }],
      }),
    );

    expect(result.current.isValid).toBe(true);
  });
});

describe('useCreateEvaluatorForm — nameError', () => {
  test('reports nothing for a blank name', () => {
    const { result } = renderForm();

    expect(result.current.nameError).toBeNull();
  });

  test('reports a format error for a name that does not match the pattern', () => {
    const { result } = renderForm();

    act(() => result.current.onChange({ name: 'Bad Name' }));

    expect(result.current.nameError?.text).toBe('AnalyticsEvaluators.NameInvalid');
  });

  test('reports a taken error for a name already on the listing', () => {
    const { result } = renderForm(['conversation-insights']);

    act(() => result.current.onChange({ name: 'conversation-insights' }));

    expect(result.current.nameError?.text).toBe('AnalyticsEvaluators.NameTaken');
  });

  test('clears once the name is corrected to a valid, unused one', () => {
    const { result } = renderForm(['conversation-insights']);

    act(() => result.current.onChange({ name: 'conversation-insights' }));
    expect(result.current.nameError).not.toBeNull();

    act(() => result.current.onChange({ name: 'conversation-summary' }));

    expect(result.current.nameError).toBeNull();
  });
});

describe('useCreateEvaluatorForm — buildDto', () => {
  test('an llm evaluator is built with no request_template member', () => {
    const { result } = renderForm();

    act(() =>
      result.current.onChange({
        name: 'conversation-insights',
        preset: 'chat_completion' as CreateEvaluatorDto['preset'],
        model: 'gpt-4o',
        output_vars: [validOutputVar],
      }),
    );

    expect(result.current.buildDto()).not.toHaveProperty('request_template');
  });

  test('flipping to sql drops the llm-only members from the built request', () => {
    const { result } = renderForm();

    act(() =>
      result.current.onChange({
        name: 'row-count',
        preset: 'chat_completion' as CreateEvaluatorDto['preset'],
        model: 'gpt-4o',
        params: { max_tokens: 10 },
        request_template: '{}',
        input_vars: [{ name: 'x', type: 'string' }],
        response_schema: { type: 'object' },
        output_vars: [{ name: 'total', type: 'long', sql: 'count(*)' }],
      }),
    );
    act(() => result.current.onChange({ type: EvaluatorType.Sql }));

    const dto = result.current.buildDto();

    expect(dto).not.toHaveProperty('preset');
    expect(dto).not.toHaveProperty('model');
    expect(dto).not.toHaveProperty('params');
    expect(dto).not.toHaveProperty('request_template');
    expect(dto).not.toHaveProperty('input_vars');
    expect(dto).not.toHaveProperty('response_schema');
  });

  test('a sql output variable expression entered under llm is posted as a sql expression, with no jsonata member', () => {
    const { result } = renderForm();

    act(() =>
      result.current.onChange({
        name: 'row-count',
        output_vars: [{ name: 'total', type: 'long', jsonata: 'count(*)' }],
      }),
    );
    act(() => result.current.onChange({ type: EvaluatorType.Sql }));

    const dto = result.current.buildDto();

    expect(dto.output_vars).toEqual([{ name: 'total', type: 'long', sql: 'count(*)' }]);
  });

  test('trims the name for the wire without mutating the draft the input stays controlled by', () => {
    const { result } = renderForm();

    act(() =>
      result.current.onChange({
        name: '  conversation-insights  ',
        preset: 'chat_completion' as CreateEvaluatorDto['preset'],
        model: 'gpt-4o',
        output_vars: [validOutputVar],
      }),
    );

    expect(result.current.buildDto().name).toBe('conversation-insights');
    expect(result.current.draft.name).toBe('  conversation-insights  ');
  });
});
