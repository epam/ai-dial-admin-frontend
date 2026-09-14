import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createEvaluator } from '@/src/app/[lang]/evaluators/actions';
import CreateEvaluatorPopup from '@/src/components/Analytics/Evaluators/CreateEvaluatorPopup';
import { AnalyticsEvaluatorsI18nKey, ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/app/[lang]/evaluators/actions');

// test-setup.tsx hands out a fresh `showNotification` spy per render, so asserting on it needs a stable
// mock of our own rather than the shared one (same pattern as EvaluatorJsonEditor.spec.tsx).
const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification }),
}));

const onClose = vi.fn();
const onCreated = vi.fn();

const renderPopup = (existingNames: string[] = []) =>
  render(<CreateEvaluatorPopup existingNames={existingNames} onClose={onClose} onCreated={onCreated} />);

const nameField = () => screen.getByLabelText(AnalyticsEvaluatorsI18nKey.Name, { exact: false });
// DialInput remounts on re-render, so per-keystroke typing detaches; set the value in one change event
// (same note as CreateTablePopup.spec.tsx).
const typeName = (value: string) => fireEvent.change(nameField(), { target: { value } });

const modelField = () => screen.getByLabelText(AnalyticsEvaluatorsI18nKey.Model, { exact: false });
const submitButton = () => screen.getByRole('button', { name: ButtonsI18nKey.Create });
const addOutputButton = () => screen.getByRole('button', { name: AnalyticsEvaluatorsI18nKey.AddOutput });
// The label carries a required marker, so these match on the prefix rather than the whole string.
const rowNameField = (index = 1) =>
  screen.getByLabelText(`${AnalyticsEvaluatorsI18nKey.VarName} ${index}`, { exact: false });
const rowProseField = (index = 1) =>
  screen.getByLabelText(`${AnalyticsEvaluatorsI18nKey.OutputProse} ${index}`, { exact: false });
const rowExpressionField = (index = 1) =>
  screen.getByLabelText(`${AnalyticsEvaluatorsI18nKey.VarExpression} ${index}`, { exact: false });
const typeRadio = (name: string) => screen.getByRole('radio', { name });

const addOutput = (name = 'topic') => {
  fireEvent.click(addOutputButton());
  fireEvent.change(rowNameField(), { target: { value: name } });
};

const fillValidLlm = () => {
  typeName('conversation-insights');
  fireEvent.change(modelField(), { target: { value: 'gpt-4o' } });
  addOutput();
  fireEvent.change(rowProseField(), { target: { value: 'One to three lowercase words.' } });
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createEvaluator).mockResolvedValue({ success: true, response: { name: 'x', version: 1 } as never });
});

describe('CreateEvaluatorPopup — an llm evaluator requires a model', () => {
  test('submission is disabled while the model is blank', () => {
    renderPopup();

    typeName('conversation-insights');
    addOutput();
    fireEvent.change(rowProseField(), { target: { value: 'One to three lowercase words.' } });

    expect(submitButton()).toBeDisabled();
  });

  test('no registration request is sent while disabled', () => {
    renderPopup();

    typeName('conversation-insights');
    addOutput();
    fireEvent.click(submitButton());

    expect(createEvaluator).not.toHaveBeenCalled();
  });

  test('submission is offered once the model is set alongside one named output carrying prose', () => {
    renderPopup();

    fillValidLlm();

    expect(submitButton()).toBeEnabled();
  });
});

describe('CreateEvaluatorPopup — no preset control is present for either type', () => {
  test('presents no preset for llm', () => {
    renderPopup();

    expect(screen.queryByLabelText('AnalyticsEvaluators.Preset', { exact: false })).not.toBeInTheDocument();
  });

  test('presents no preset for sql either', () => {
    renderPopup();

    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql));

    expect(screen.queryByLabelText('AnalyticsEvaluators.Preset', { exact: false })).not.toBeInTheDocument();
  });
});

describe('CreateEvaluatorPopup — a sql evaluator offers none of the members its type forbids', () => {
  test('presents no model, params or request-template control', () => {
    renderPopup();

    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql));

    expect(screen.queryByLabelText(AnalyticsEvaluatorsI18nKey.Model, { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.SectionParams)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.SectionRequestTemplate)).not.toBeInTheDocument();
  });

  test('still presents the name, type, and outputs controls', () => {
    renderPopup();

    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql));

    expect(nameField()).toBeInTheDocument();
    expect(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql)).toBeChecked();
    expect(screen.getByRole('region', { name: AnalyticsEvaluatorsI18nKey.SectionOutputVars })).toBeInTheDocument();
  });
});

describe('CreateEvaluatorPopup — at least one output is required for either type', () => {
  test('disables submission and shows no validation message or empty-state text for llm', () => {
    renderPopup();

    typeName('conversation-insights');

    expect(submitButton()).toBeDisabled();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.OutputVarsRequired)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.NoOutputVars)).not.toBeInTheDocument();
    expect(addOutputButton()).toBeInTheDocument();
  });

  test('disables submission and shows no validation message or empty-state text for sql', () => {
    renderPopup();

    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql));
    typeName('row-count');

    expect(submitButton()).toBeDisabled();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.OutputVarsRequired)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.NoOutputVars)).not.toBeInTheDocument();
    expect(addOutputButton()).toBeInTheDocument();
  });
});

describe('CreateEvaluatorPopup — a sql output requires its expression', () => {
  test('disables submission for a named output with no expression', () => {
    renderPopup();

    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql));
    typeName('row-count');
    addOutput('total');

    expect(submitButton()).toBeDisabled();
  });

  test('enables submission once that output also carries an expression', () => {
    renderPopup();

    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql));
    typeName('row-count');
    addOutput('total');
    fireEvent.change(rowExpressionField(), { target: { value: 'count(*)' } });

    expect(submitButton()).toBeEnabled();
  });
});

describe('CreateEvaluatorPopup — an llm evaluator is registered with no request template', () => {
  test('the registration request carries no request_template member', async () => {
    renderPopup();

    fillValidLlm();
    fireEvent.click(submitButton());

    await vi.waitFor(() => expect(createEvaluator).toHaveBeenCalled());
    expect(vi.mocked(createEvaluator).mock.calls[0][0]).not.toHaveProperty('request_template');
  });

  test('the request carries the outputs keyed by name', async () => {
    renderPopup();

    fillValidLlm();
    fireEvent.click(submitButton());

    await vi.waitFor(() => expect(createEvaluator).toHaveBeenCalled());
    expect(vi.mocked(createEvaluator).mock.calls[0][0].outputs).toEqual({
      topic: { prose: 'One to three lowercase words.' },
    });
  });
});

describe('CreateEvaluatorPopup — the modal offers no optional-member editor and no JSON mode', () => {
  test('renders no params editor, request-template field or JSON toggle for llm', () => {
    renderPopup();

    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.SectionParams)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.SectionRequestTemplate)).not.toBeInTheDocument();
    expect(screen.queryByText(EntitiesI18nKey.JSONEditor)).not.toBeInTheDocument();
  });

  test('renders none of them for sql either', () => {
    renderPopup();

    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql));

    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.SectionParams)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.SectionRequestTemplate)).not.toBeInTheDocument();
    expect(screen.queryByText(EntitiesI18nKey.JSONEditor)).not.toBeInTheDocument();
  });
});

describe('CreateEvaluatorPopup — flipping to sql rebuilds the request', () => {
  test('the declaration is dropped, since prose is not an expression', () => {
    renderPopup();

    typeName('row-count');
    fireEvent.change(modelField(), { target: { value: 'gpt-4o' } });
    addOutput('total');
    fireEvent.change(rowProseField(), { target: { value: 'How severe the issue is.' } });

    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql));

    expect(screen.queryByLabelText(`${AnalyticsEvaluatorsI18nKey.VarName} 1`, { exact: false })).toBeNull();
  });

  test('the request carries no llm-only member once the expression is stated under sql', async () => {
    renderPopup();

    typeName('row-count');
    fireEvent.change(modelField(), { target: { value: 'gpt-4o' } });

    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql));
    addOutput('total');
    fireEvent.change(rowExpressionField(), { target: { value: 'count(*)' } });
    fireEvent.click(submitButton());

    await vi.waitFor(() => expect(createEvaluator).toHaveBeenCalled());
    const request = vi.mocked(createEvaluator).mock.calls[0][0] as Record<string, unknown>;

    ['preset', 'model', 'params', 'request_template'].forEach((key) => expect(request).not.toHaveProperty(key));
    expect(request.outputs).toEqual({ total: 'count(*)' });
  });

  test('flipping the type back restores what was typed', () => {
    renderPopup();

    typeName('row-count');
    fireEvent.change(modelField(), { target: { value: 'gpt-4o' } });

    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql));
    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeLlm));

    expect(modelField()).toHaveValue('gpt-4o');
  });
});

describe('CreateEvaluatorPopup — the result of a registration', () => {
  test('reports creation and closes', async () => {
    renderPopup();

    fillValidLlm();
    fireEvent.click(submitButton());

    await vi.waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
    expect(showNotification).toHaveBeenCalled();
  });

  test('shows the service error and neither closes the modal nor reports creation', async () => {
    vi.mocked(createEvaluator).mockResolvedValue({ success: false, errorMessage: 'refused' });
    renderPopup();

    fillValidLlm();
    fireEvent.click(submitButton());

    await vi.waitFor(() => expect(showNotification).toHaveBeenCalled());
    expect(onCreated).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('CreateEvaluatorPopup — name validation', () => {
  test('reports a name already registered and withholds submission', () => {
    renderPopup(['conversation-insights']);

    fillValidLlm();

    expect(screen.getByText(AnalyticsEvaluatorsI18nKey.NameTaken)).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });

  test('correcting the name clears the inline error and offers submission once the rest is valid', () => {
    renderPopup(['conversation-insights']);

    fillValidLlm();
    typeName('conversation-insights-2');

    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.NameTaken)).not.toBeInTheDocument();
    expect(submitButton()).toBeEnabled();
  });
});
