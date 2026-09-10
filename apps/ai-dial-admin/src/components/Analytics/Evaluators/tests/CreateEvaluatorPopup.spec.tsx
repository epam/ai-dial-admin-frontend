import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createEvaluator } from '@/src/app/[lang]/evaluators/actions';
import CreateEvaluatorPopup from '@/src/components/Analytics/Evaluators/CreateEvaluatorPopup';
import { AnalyticsEvaluatorsI18nKey, ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { EvaluatorPreset } from '@/src/models/analytics/evaluator';

vi.mock('@/src/app/[lang]/evaluators/actions');

// test-setup.tsx hands out a fresh `showNotification` spy per render, so asserting on it needs a stable
// mock of our own rather than the shared one (same pattern as EvaluatorJsonEditor.spec.tsx).
const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification }),
}));

interface MockSelectProps {
  id: string;
  label?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (next: string) => void;
}

// DialSelectField is a floating-ui dropdown, not a native control; stood in for as a labeled native
// select — the same substitution CreatePipelinePopup.spec.tsx and CreateTablePopup.spec.tsx use — so the
// single preset option can be chosen with `selectOptions` instead of driving a Radix-style popover.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialSelectField: ({ id, label, options, value, onChange }: MockSelectProps) => (
      <label>
        {label ?? id}
        <select value={value ?? ''} onChange={(e) => onChange?.(e.target.value)}>
          <option value="">--</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    ),
  };
});

const onClose = vi.fn();
const onCreated = vi.fn();

const renderPopup = (existingNames: string[] = []) =>
  render(<CreateEvaluatorPopup existingNames={existingNames} onClose={onClose} onCreated={onCreated} />);

const nameField = () => screen.getByLabelText(AnalyticsEvaluatorsI18nKey.Name, { exact: false });
// DialInput remounts on re-render, so per-keystroke typing detaches; set the value in one change event
// (same note as CreateTablePopup.spec.tsx).
const typeName = (value: string) => fireEvent.change(nameField(), { target: { value } });

const presetField = () => screen.getByLabelText(AnalyticsEvaluatorsI18nKey.Preset, { exact: false });
const modelField = () => screen.getByLabelText(AnalyticsEvaluatorsI18nKey.Model, { exact: false });
const submitButton = () => screen.getByRole('button', { name: ButtonsI18nKey.Create });
const addVariableButton = () => screen.getByRole('button', { name: AnalyticsEvaluatorsI18nKey.AddVariable });
const rowNameField = (index = 1) => screen.getByLabelText(`${AnalyticsEvaluatorsI18nKey.VarName} ${index}`);
const rowExpressionField = (index = 1) => screen.getByLabelText(`${AnalyticsEvaluatorsI18nKey.VarExpression} ${index}`);
const typeRadio = (name: string) => screen.getByRole('radio', { name });

const fillLlmOutputVar = (name = 'topic') => {
  fireEvent.click(addVariableButton());
  fireEvent.change(rowNameField(), { target: { value: name } });
};

const fillValidLlm = async (user: ReturnType<typeof userEvent.setup>) => {
  typeName('conversation-insights');
  await user.selectOptions(presetField(), EvaluatorPreset.ChatCompletion);
  fireEvent.change(modelField(), { target: { value: 'gpt-4o' } });
  fillLlmOutputVar();
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createEvaluator).mockResolvedValue({ success: true, response: { name: 'x', version: 1 } as never });
});

describe('CreateEvaluatorPopup — an llm evaluator requires a preset and a model', () => {
  test('submission is disabled while the preset is blank', () => {
    renderPopup();

    typeName('conversation-insights');
    fireEvent.change(modelField(), { target: { value: 'gpt-4o' } });
    fillLlmOutputVar();

    expect(submitButton()).toBeDisabled();
  });

  test('submission is disabled while the model is blank', async () => {
    const user = userEvent.setup();
    renderPopup();

    typeName('conversation-insights');
    await user.selectOptions(presetField(), EvaluatorPreset.ChatCompletion);
    fillLlmOutputVar();

    expect(submitButton()).toBeDisabled();
  });

  test('no registration request is sent while disabled', async () => {
    const user = userEvent.setup();
    renderPopup();

    typeName('conversation-insights');
    await user.selectOptions(presetField(), EvaluatorPreset.ChatCompletion);
    fillLlmOutputVar();
    fireEvent.click(submitButton());

    expect(createEvaluator).not.toHaveBeenCalled();
  });

  test('submission is offered once both are set alongside one named, typed output variable', async () => {
    const user = userEvent.setup();
    renderPopup();

    await fillValidLlm(user);

    expect(submitButton()).toBeEnabled();
  });
});

describe('CreateEvaluatorPopup — a sql evaluator offers none of the members its type forbids', () => {
  test('presents no preset, model, params, request-template, input-variables, or response-schema control', () => {
    renderPopup();

    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql));

    expect(screen.queryByLabelText(AnalyticsEvaluatorsI18nKey.Preset, { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(AnalyticsEvaluatorsI18nKey.Model, { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.SectionParams)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.SectionRequestTemplate)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.SectionInputVars)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.SectionResponseSchema)).not.toBeInTheDocument();
  });

  test('still presents the name, type, and output-variables controls', () => {
    renderPopup();

    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql));

    expect(nameField()).toBeInTheDocument();
    expect(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql)).toBeChecked();
    expect(screen.getByRole('region', { name: AnalyticsEvaluatorsI18nKey.SectionOutputVars })).toBeInTheDocument();
  });
});

describe('CreateEvaluatorPopup — at least one output variable is required for either type', () => {
  test('disables submission and shows no validation message or empty-state text for llm', () => {
    renderPopup();

    typeName('conversation-insights');

    expect(submitButton()).toBeDisabled();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.OutputVarsRequired)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.NoOutputVars)).not.toBeInTheDocument();
    expect(addVariableButton()).toBeInTheDocument();
  });

  test('disables submission and shows no validation message or empty-state text for sql', () => {
    renderPopup();

    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql));
    typeName('row-count');

    expect(submitButton()).toBeDisabled();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.OutputVarsRequired)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.NoOutputVars)).not.toBeInTheDocument();
    expect(addVariableButton()).toBeInTheDocument();
  });
});

describe('CreateEvaluatorPopup — a sql output variable requires its expression', () => {
  test('disables submission for a named, typed variable with no expression', () => {
    renderPopup();

    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql));
    typeName('row-count');
    fillLlmOutputVar('total');

    expect(submitButton()).toBeDisabled();
  });

  test('enables submission once that variable also carries an expression', () => {
    renderPopup();

    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql));
    typeName('row-count');
    fillLlmOutputVar('total');
    fireEvent.change(rowExpressionField(), { target: { value: 'count(*)' } });

    expect(submitButton()).toBeEnabled();
  });
});

describe('CreateEvaluatorPopup — an llm evaluator is registered with no request template', () => {
  test('the registration request carries no request_template member', async () => {
    const user = userEvent.setup();
    renderPopup();

    await fillValidLlm(user);
    fireEvent.click(submitButton());

    await vi.waitFor(() => expect(createEvaluator).toHaveBeenCalled());
    expect(vi.mocked(createEvaluator).mock.calls[0][0]).not.toHaveProperty('request_template');
  });
});

describe('CreateEvaluatorPopup — the modal offers no optional-member editor and no JSON mode', () => {
  test('renders no params editor, request-template field, input-variables editor, response-schema editor, or JSON toggle for llm', () => {
    renderPopup();

    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.SectionParams)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.SectionRequestTemplate)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.SectionInputVars)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.SectionResponseSchema)).not.toBeInTheDocument();
    expect(screen.queryByText(EntitiesI18nKey.JSONEditor)).not.toBeInTheDocument();
  });

  test('renders none of them for sql either', () => {
    renderPopup();

    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql));

    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.SectionParams)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.SectionRequestTemplate)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.SectionInputVars)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.SectionResponseSchema)).not.toBeInTheDocument();
    expect(screen.queryByText(EntitiesI18nKey.JSONEditor)).not.toBeInTheDocument();
  });
});

describe('CreateEvaluatorPopup — flipping to sql drops the llm-only members from the request', () => {
  test('the registration request carries neither preset/model nor params/request_template/input_vars/response_schema', async () => {
    const user = userEvent.setup();
    renderPopup();

    typeName('row-count');
    await user.selectOptions(presetField(), EvaluatorPreset.ChatCompletion);
    fireEvent.change(modelField(), { target: { value: 'gpt-4o' } });

    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql));
    fillLlmOutputVar('total');
    fireEvent.change(rowExpressionField(), { target: { value: 'count(*)' } });
    fireEvent.click(submitButton());

    await vi.waitFor(() => expect(createEvaluator).toHaveBeenCalled());
    const dto = vi.mocked(createEvaluator).mock.calls[0][0];
    expect(dto).not.toHaveProperty('preset');
    expect(dto).not.toHaveProperty('model');
    expect(dto).not.toHaveProperty('params');
    expect(dto).not.toHaveProperty('request_template');
    expect(dto).not.toHaveProperty('input_vars');
    expect(dto).not.toHaveProperty('response_schema');
  });
});

describe('CreateEvaluatorPopup — flipping the type back restores what was typed', () => {
  test('the model entered before switching to sql is still presented after switching back to llm', () => {
    renderPopup();

    fireEvent.change(modelField(), { target: { value: 'gpt-4o' } });

    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql));
    expect(screen.queryByLabelText(AnalyticsEvaluatorsI18nKey.Model, { exact: false })).not.toBeInTheDocument();

    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeLlm));

    expect(modelField()).toHaveValue('gpt-4o');
  });
});

describe("CreateEvaluatorPopup — a sql output variable's expression is posted as a sql expression", () => {
  test('the variable carries its expression under sql, with no jsonata member', async () => {
    const user = userEvent.setup();
    renderPopup();

    typeName('row-count');
    await user.selectOptions(presetField(), EvaluatorPreset.ChatCompletion);
    fireEvent.change(modelField(), { target: { value: 'gpt-4o' } });
    fillLlmOutputVar('total');
    fireEvent.change(rowExpressionField(), { target: { value: 'count(*)' } });

    fireEvent.click(typeRadio(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql));
    fireEvent.click(submitButton());

    await vi.waitFor(() => expect(createEvaluator).toHaveBeenCalled());
    const dto = vi.mocked(createEvaluator).mock.calls[0][0];
    expect(dto.output_vars).toEqual([{ name: 'total', type: expect.any(String), sql: 'count(*)' }]);
    expect(dto.output_vars?.[0]).not.toHaveProperty('jsonata');
  });
});

describe('CreateEvaluatorPopup — name validation', () => {
  test('a name that does not match the pattern is reported inline, submission is disabled, and no notification is shown', () => {
    renderPopup();

    typeName('Bad Name');

    expect(screen.getByText(AnalyticsEvaluatorsI18nKey.NameInvalid)).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
    expect(showNotification).not.toHaveBeenCalled();
  });

  test('a name already on the listing is reported inline, submission is disabled, and no request is sent', () => {
    renderPopup(['conversation-insights']);

    typeName('conversation-insights');
    fireEvent.click(submitButton());

    expect(screen.getByText(AnalyticsEvaluatorsI18nKey.NameTaken)).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
    expect(createEvaluator).not.toHaveBeenCalled();
  });

  test('correcting the name clears the inline error and offers submission once the rest is valid', async () => {
    const user = userEvent.setup();
    renderPopup(['conversation-insights']);

    typeName('conversation-insights');
    expect(screen.getByText(AnalyticsEvaluatorsI18nKey.NameTaken)).toBeInTheDocument();

    typeName('conversation-summary');
    await user.selectOptions(presetField(), EvaluatorPreset.ChatCompletion);
    fireEvent.change(modelField(), { target: { value: 'gpt-4o' } });
    fillLlmOutputVar();

    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.NameTaken)).not.toBeInTheDocument();
    expect(submitButton()).toBeEnabled();
  });
});

describe('CreateEvaluatorPopup — a created evaluator is reported as created and the modal closes', () => {
  test('reports creation and closes', async () => {
    const user = userEvent.setup();
    renderPopup();

    await fillValidLlm(user);
    fireEvent.click(submitButton());

    await vi.waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: AnalyticsEvaluatorsI18nKey.EvaluatorCreated }),
      ),
    );
    expect(onCreated).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("CreateEvaluatorPopup — a rejected registration keeps the modal open and shows the service's error", () => {
  test('shows the service error and neither closes the modal nor reports creation', async () => {
    vi.mocked(createEvaluator).mockResolvedValue({
      success: false,
      errorHeader: 'evaluator_validation_failed',
      errorMessage: 'model must not be blank',
    });
    const user = userEvent.setup();
    renderPopup();

    await fillValidLlm(user);
    fireEvent.click(submitButton());

    await vi.waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'evaluator_validation_failed',
          description: 'model must not be blank',
        }),
      ),
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
    expect(modelField()).toHaveValue('gpt-4o');
  });
});
