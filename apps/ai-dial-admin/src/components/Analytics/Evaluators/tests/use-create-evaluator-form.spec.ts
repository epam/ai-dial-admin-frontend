import { act, renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { useCreateEvaluatorForm } from '@/src/components/Analytics/Evaluators/use-create-evaluator-form';
import { CreateEvaluatorDto, EvaluatorType } from '@/src/models/analytics/evaluator';

const renderForm = (existingNames: string[] = []) => renderHook(() => useCreateEvaluatorForm({ existingNames }));

const validOutput = { name: 'topic', prose: 'One to three lowercase words.' };

describe('useCreateEvaluatorForm — initial state', () => {
  test('starts as an llm draft with no name and no output variables', () => {
    const { result } = renderForm();

    expect(result.current.draft).toEqual<CreateEvaluatorDto>({ name: '', type: EvaluatorType.Llm, outputs: [] });
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

    act(() => result.current.onChange({ model: 'gpt-4o' }));
    act(() => result.current.onChange({ type: EvaluatorType.Sql }));
    act(() => result.current.onChange({ type: EvaluatorType.Llm }));

    expect(result.current.draft.model).toBe('gpt-4o');
  });
});

describe('useCreateEvaluatorForm — isValid: an llm evaluator requires a model', () => {
  test('is invalid while the model is blank, even with an output', () => {
    const { result } = renderForm();

    act(() =>
      result.current.onChange({
        name: 'conversation-insights',
        outputs: [validOutput],
      }),
    );

    expect(result.current.isValid).toBe(false);
  });

  test('is invalid while the name is blank, even with a model and an output', () => {
    const { result } = renderForm();

    act(() => result.current.onChange({ name: '', model: 'gpt-4o', outputs: [validOutput] }));

    expect(result.current.isValid).toBe(false);
  });

  test('is valid once the name, model, and one named output carrying prose are all set', () => {
    const { result } = renderForm();

    act(() =>
      result.current.onChange({
        name: 'conversation-insights',
        model: 'gpt-4o',
        outputs: [validOutput],
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

describe('useCreateEvaluatorForm — isValid: a sql output requires its expression', () => {
  test('is invalid when the output has a name but no expression', () => {
    const { result } = renderForm();

    act(() =>
      result.current.onChange({
        name: 'row-count',
        type: EvaluatorType.Sql,
        outputs: [{ name: 'total' }],
      }),
    );

    expect(result.current.isValid).toBe(false);
  });

  test('is valid once that output also carries an expression', () => {
    const { result } = renderForm();

    act(() =>
      result.current.onChange({
        name: 'row-count',
        type: EvaluatorType.Sql,
        outputs: [{ name: 'total', sql: 'count(*)' }],
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
        model: 'gpt-4o',
        outputs: [validOutput],
      }),
    );

    expect(result.current.buildDto()).not.toHaveProperty('request_template');
  });

  test('flipping to sql drops the llm-only members from the built request', () => {
    const { result } = renderForm();

    act(() =>
      result.current.onChange({
        name: 'row-count',
        model: 'gpt-4o',
        params: { max_tokens: 10 },
        request_template: '{}',
      }),
    );
    act(() => result.current.onChange({ type: EvaluatorType.Sql }));
    act(() => result.current.onChange({ outputs: [{ name: 'total', sql: 'count(*)' }] }));

    const dto = result.current.buildDto();

    expect(dto).not.toHaveProperty('preset');
    expect(dto).not.toHaveProperty('model');
    expect(dto).not.toHaveProperty('params');
    expect(dto).not.toHaveProperty('request_template');
    expect(dto.outputs).toEqual({ total: 'count(*)' });
  });

  test('flipping the type drops the declaration, which states something else under the other type', () => {
    const { result } = renderForm();

    act(() =>
      result.current.onChange({
        name: 'row-count',
        outputs: [{ name: 'total', prose: 'How severe the issue is.' }],
      }),
    );
    act(() => result.current.onChange({ type: EvaluatorType.Sql }));

    expect(result.current.draft.outputs).toEqual([]);
    expect(result.current.buildDto().outputs).toEqual({});
  });

  test('keeps a declaration stated by the same patch that changes the type', () => {
    const { result } = renderForm();

    act(() =>
      result.current.onChange({
        name: 'row-count',
        type: EvaluatorType.Sql,
        outputs: [{ name: 'total', sql: 'count(*)' }],
      }),
    );

    expect(result.current.buildDto().outputs).toEqual({ total: 'count(*)' });
  });

  test('trims the name for the wire without mutating the draft the input stays controlled by', () => {
    const { result } = renderForm();

    act(() =>
      result.current.onChange({
        name: '  conversation-insights  ',
        model: 'gpt-4o',
        outputs: [validOutput],
      }),
    );

    expect(result.current.buildDto().name).toBe('conversation-insights');
    expect(result.current.draft.name).toBe('  conversation-insights  ');
  });
});
