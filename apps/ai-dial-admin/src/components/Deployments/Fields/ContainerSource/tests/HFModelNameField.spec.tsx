import { render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import HFModelNameField from '@/src/components/Deployments/Fields/ContainerSource/HFModelNameField';
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
