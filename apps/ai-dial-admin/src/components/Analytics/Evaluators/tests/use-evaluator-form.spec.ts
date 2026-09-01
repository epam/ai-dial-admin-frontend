import { act, renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { useEvaluatorForm } from '@/src/components/Analytics/Evaluators/use-evaluator-form';
import {
  CreateEvaluatorDto,
  Evaluator,
  EvaluatorPreset,
  EvaluatorSummary,
  EvaluatorType,
} from '@/src/models/analytics/evaluator';

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
  output_vars: [{ name: 'topic', type: 'string', jsonata: 'topic' }],
  created_at: '2026-08-19T10:00:00Z',
};

const summary: EvaluatorSummary = { name: llm.name, latest_version: 4 };

const renderForm = () => renderHook(() => useEvaluatorForm({ evaluator: llm, summary }));

describe('useEvaluatorForm — replaceDraft', () => {
  test('replaces the draft rather than merging into it', () => {
    const { result } = renderForm();

    const withoutModel = { ...result.current.draft };
    delete (withoutModel as Partial<CreateEvaluatorDto>).model;

    act(() => result.current.replaceDraft(withoutModel));

    expect(result.current.draft.model).toBeUndefined();
  });

  test('a member dropped by replaceDraft is absent from the assembled request', () => {
    const { result } = renderForm();

    const withoutTemplate = { ...result.current.draft };
    delete (withoutTemplate as Partial<CreateEvaluatorDto>).request_template;

    act(() => result.current.replaceDraft(withoutTemplate));

    expect(result.current.buildDto()).not.toHaveProperty('request_template');
  });

  test('onChange still merges, so it leaves untouched members alone', () => {
    const { result } = renderForm();

    act(() => result.current.onChange({ model: 'gpt-4o' }));

    expect(result.current.draft.model).toBe('gpt-4o');
    expect(result.current.draft.request_template).toBe(llm.request_template);
  });

  test('isChanged reflects a replacement', () => {
    const { result } = renderForm();

    expect(result.current.isChanged).toBe(false);

    act(() => result.current.replaceDraft({ ...result.current.draft, model: 'gpt-4o' }));

    expect(result.current.isChanged).toBe(true);
  });

  test('replacing with the stored definition leaves the form unchanged', () => {
    const { result } = renderForm();

    act(() => result.current.replaceDraft({ ...result.current.draft, model: 'gpt-4o' }));
    act(() => result.current.reset());

    expect(result.current.isChanged).toBe(false);
    expect(result.current.draft.model).toBe(llm.model);
  });
});
