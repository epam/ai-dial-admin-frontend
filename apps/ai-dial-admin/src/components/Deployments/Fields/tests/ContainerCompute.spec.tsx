import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { Container } from '@/src/models/deployments/containers';
import { CONTAINER_SOURCE_TYPE, CONTAINER_STATUS, CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';

import ContainerCompute from '@/src/components/Deployments/Fields/ContainerCompute';

let mockValidationState: { isValid: boolean; errorFields?: Map<string, boolean> } = { isValid: true };

vi.mock('@/src/context/SaveValidationContext', () => ({
  SaveValidationContextProvider: ({ children }: { children: React.ReactNode }) => children,
  useSaveValidationContext: () => ({
    isValid: mockValidationState.isValid,
    errorFields: mockValidationState.errorFields,
    dispatch: vi.fn(),
    resetCounter: 0,
  }),
  ValidationActionType: { SetField: 'SET_FIELD_VALIDATION', Reset: 'RESET' },
}));

vi.mock('@/src/components/Deployments/Fields/ContainerNodePool', () => ({
  default: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="node-pool-stub" data-disabled={String(!!disabled)} />
  ),
}));

vi.mock('@/src/components/Deployments/Fields/ContainerResources', () => ({
  default: ({ disabled, route }: { disabled?: boolean; route: ApplicationRoute }) => (
    <div data-testid="resources-stub" data-disabled={String(!!disabled)} data-route={route} />
  ),
}));

const baseContainer: Container = {
  $type: CONTAINER_TYPE.MCP,
  name: 'test-container',
  displayName: 'Test Container',
  status: CONTAINER_STATUS.NOT_DEPLOYED,
  source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: '' },
  metadata: { envs: [] },
};

const renderCompute = (overrides?: { disabled?: boolean; route?: ApplicationRoute }) => {
  const setContainer = vi.fn();
  render(
    <ContainerCompute
      container={baseContainer}
      setContainer={setContainer}
      route={overrides?.route ?? ApplicationRoute.McpContainers}
      disabled={overrides?.disabled}
    />,
  );
  return { setContainer };
};

describe('ContainerCompute', () => {
  afterEach(() => {
    mockValidationState = { isValid: true };
  });

  test('renders the Compute accordion title', () => {
    renderCompute();
    expect(screen.getByText(EntityFieldsI18nKey.Compute)).toBeInTheDocument();
  });

  test('renders NodePool before Resources', () => {
    renderCompute();
    const nodePool = screen.getByTestId('node-pool-stub');
    const resources = screen.getByTestId('resources-stub');
    expect(nodePool).toBeInTheDocument();
    expect(resources).toBeInTheDocument();
    expect(nodePool.compareDocumentPosition(resources) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('forwards disabled to both children', () => {
    renderCompute({ disabled: true });
    expect(screen.getByTestId('node-pool-stub')).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByTestId('resources-stub')).toHaveAttribute('data-disabled', 'true');
  });

  test('forwards route to ContainerResources', () => {
    renderCompute({ route: ApplicationRoute.ModelServings });
    expect(screen.getByTestId('resources-stub')).toHaveAttribute('data-route', ApplicationRoute.ModelServings);
  });

  test('does not show error indicator when validation is valid', () => {
    mockValidationState = { isValid: true };
    renderCompute();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('shows error indicator when a tracked field is invalid', () => {
    mockValidationState = { isValid: false, errorFields: new Map([['cpuRequest', false]]) };
    renderCompute();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('does not show error indicator for unrelated error keys', () => {
    mockValidationState = { isValid: false, errorFields: new Map([['somethingElse', false]]) };
    renderCompute();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
