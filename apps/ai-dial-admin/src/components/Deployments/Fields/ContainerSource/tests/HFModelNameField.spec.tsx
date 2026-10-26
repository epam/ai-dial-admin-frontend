import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getHuggingFaceModels } from '@/src/app/actions/deployments';
import HFModelNameField from '@/src/components/Deployments/Fields/ContainerSource/HFModelNameField';
import { BasicI18nKey, ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { ValidationActionType } from '@/src/context/SaveValidationContext';
import { Container } from '@/src/models/deployments/containers';
import { CONTAINER_SOURCE_TYPE, CONTAINER_STATUS, CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';

const mockDispatch = vi.fn();

vi.mock('@/src/context/SaveValidationContext', () => ({
  useSaveValidationContext: () => ({ dispatch: mockDispatch, resetCounter: 0 }),
  ValidationActionType: {
    SetField: 'SET_FIELD_VALIDATION',
    RemoveField: 'REMOVE_FIELD_VALIDATION',
  },
}));

vi.mock('@/src/app/actions/deployments', () => ({
  getHuggingFaceModels: vi.fn(() => Promise.resolve({ success: true, response: { models: [] } })),
}));

const buildContainer = (modelName?: string): Container => ({
  $type: CONTAINER_TYPE.HF,
  name: 'hf-container',
  status: CONTAINER_STATUS.STOPPED,
  source: { $type: CONTAINER_SOURCE_TYPE.HUGGINGFACE, modelName },
  metadata: { envs: [] },
});

const renderField = (modelName?: string) =>
  render(
    <HFModelNameField
      container={buildContainer(modelName)}
      setContainer={vi.fn()}
      route={ApplicationRoute.ModelServings}
    />,
  );

describe('HFModelNameField validation lifecycle', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
  });

  test('registers modelName as invalid on mount when modelName is empty', () => {
    renderField(undefined);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'modelName',
      isValid: false,
    });
  });

  test('registers modelName as valid on mount when modelName is well-formed', () => {
    renderField('owner/repo');

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'modelName',
      isValid: true,
    });
  });

  test('dispatches RemoveField for modelName on unmount', () => {
    const { unmount } = renderField(undefined);

    mockDispatch.mockClear();
    unmount();

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.RemoveField,
      field: 'modelName',
    });
  });
});

describe('HFModelNameField free-text entry', () => {
  const renderEditable = (container = buildContainer(undefined)) => {
    const setContainer = vi.fn();
    const user = userEvent.setup();
    render(
      <>
        <HFModelNameField container={container} setContainer={setContainer} route={ApplicationRoute.ModelServings} />
        <button type="button">outside</button>
      </>,
    );
    return {
      user,
      setContainer,
      input: screen.getByRole('combobox', { name: new RegExp(EntityFieldsI18nKey.HFModelName) }),
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getHuggingFaceModels).mockResolvedValue({
      success: true,
      response: { models: [{ id: 'meta/llama-3' }, { id: 'meta/llama-2' }] },
    } as Awaited<ReturnType<typeof getHuggingFaceModels>>);
  });

  test('commits a typed model id that is not suggested when the field is left', async () => {
    const { user, setContainer, input } = renderEditable();

    await user.type(input, 'org/my-private-model');
    expect(setContainer).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'outside' }));

    expect(setContainer).toHaveBeenCalledWith(
      expect.objectContaining({ source: expect.objectContaining({ modelName: 'org/my-private-model' }) }),
    );
  });

  test('leaving an untouched field does not change the container', async () => {
    const { user, setContainer, input } = renderEditable();

    await user.click(input);
    await user.click(screen.getByRole('button', { name: 'outside' }));

    expect(setContainer).not.toHaveBeenCalled();
  });

  test('suggests HuggingFace models after three typed characters', async () => {
    const { user, input } = renderEditable();

    await user.type(input, 'lla');

    expect(await screen.findByRole('option', { name: 'meta/llama-3' })).toBeTruthy();
    expect(getHuggingFaceModels).toHaveBeenCalledWith({ search: 'lla' });
  });

  test('applies a picked model id at once', async () => {
    const { user, setContainer, input } = renderEditable();

    await user.type(input, 'lla');
    await user.click(await screen.findByRole('option', { name: 'meta/llama-2' }));

    expect(setContainer).toHaveBeenCalledWith(
      expect.objectContaining({ source: expect.objectContaining({ modelName: 'meta/llama-2' }) }),
    );
  });

  test('disables the field and the registry button for a running container', () => {
    const { input } = renderEditable({ ...buildContainer('owner/repo'), status: CONTAINER_STATUS.RUNNING });

    expect(input).toBeDisabled();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.HFRegistry })).toBeDisabled();
  });
});

describe('HFModelNameField suggestion loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLoading = () => {
    const user = userEvent.setup();
    render(
      <HFModelNameField
        container={buildContainer(undefined)}
        setContainer={vi.fn()}
        route={ApplicationRoute.ModelServings}
      />,
    );
    return { user, input: screen.getByRole('combobox', { name: new RegExp(EntityFieldsI18nKey.HFModelName) }) };
  };

  test('shows a spinner while HuggingFace models load', async () => {
    let resolveSearch!: (value: Awaited<ReturnType<typeof getHuggingFaceModels>>) => void;
    vi.mocked(getHuggingFaceModels).mockImplementation(() => new Promise((resolve) => (resolveSearch = resolve)));
    const { user, input } = renderLoading();

    await user.type(input, 'lla');

    expect(await screen.findByRole('img', { name: BasicI18nKey.Loading })).toBeTruthy();
    resolveSearch({ success: true, response: { models: [{ id: 'meta/llama-3' }] } } as Awaited<
      ReturnType<typeof getHuggingFaceModels>
    >);
    expect(await screen.findByRole('option', { name: 'meta/llama-3' })).toBeTruthy();
    expect(screen.queryByRole('img', { name: BasicI18nKey.Loading })).toBeNull();
  });

  test('clears stale suggestions when a search returns nothing', async () => {
    vi.mocked(getHuggingFaceModels)
      .mockResolvedValueOnce({ success: true, response: { models: [{ id: 'meta/llama-3' }] } } as Awaited<
        ReturnType<typeof getHuggingFaceModels>
      >)
      .mockResolvedValue({ success: true, response: { models: [] } } as Awaited<
        ReturnType<typeof getHuggingFaceModels>
      >);
    const { user, input } = renderLoading();

    await user.type(input, 'lla');
    expect(await screen.findByRole('option', { name: 'meta/llama-3' })).toBeTruthy();
    await user.type(input, 'zzz');

    expect(await screen.findByRole('combobox', { expanded: false })).toBeTruthy();
    expect(screen.queryByRole('option')).toBeNull();
  });
});
