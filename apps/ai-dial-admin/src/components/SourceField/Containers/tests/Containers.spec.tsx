import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import Containers from '@/src/components/SourceField/Containers/Containers';
import { isMcpContainer, isTextClassificationInferenceContainer } from '@/src/components/SourceField/utils';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { CONTAINER_TYPE, INFERENCE_TASK } from '@/src/types/deployments/containers';
import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';

// Resolve the protected request by simply invoking the passed action.
vi.mock('@/src/hooks/use-protected-request', () => ({
  useProtectedRequest: () => (action: () => Promise<unknown>) => action(),
}));
vi.mock('@/src/hooks/use-is-mobile-screen', () => ({
  useIsMobileScreen: () => false,
}));

vi.mock('@epam/ai-dial-ui-kit', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@epam/ai-dial-ui-kit');
  return {
    ...actual,
    DialSelectField: ({ options, value, onChange }: any) => (
      <select aria-label="container-select" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">--</option>
        {options?.map((o: any) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    ),
  };
});

const mixed: Container[] = [
  { name: 'mcp-1', displayName: 'MCP One', status: 'running', $type: CONTAINER_TYPE.MCP },
  {
    name: 'clf-1',
    displayName: 'Classifier',
    status: 'running',
    $type: CONTAINER_TYPE.HF,
    inferenceTask: INFERENCE_TASK.TEXT_CLASSIFICATION,
  },
  {
    name: 'gen-1',
    displayName: 'Generator',
    status: 'running',
    $type: CONTAINER_TYPE.HF,
    inferenceTask: INFERENCE_TASK.TEXT_GENERATION,
  },
] as unknown as Container[];

const renderWithFilter = (containerFilter: (c: Container) => boolean) => {
  const getContainers = vi.fn().mockResolvedValue({ response: mixed });
  render(
    <Containers
      entity={{ source: { $type: SOURCE_TYPE.CONTAINER } } as any}
      onChange={vi.fn()}
      getContainers={getContainers}
      containerFilter={containerFilter}
      view={ApplicationRoute.Toolsets}
      isModal
      error=""
    />,
  );
};

const optionLabels = () =>
  screen
    .getAllByRole('option')
    .map((o) => o.textContent)
    .filter((t) => t && t !== '--');

describe('Containers toolset filtering', () => {
  test('MCP filter shows only MCP containers', async () => {
    renderWithFilter(isMcpContainer);
    await screen.findByRole('option', { name: 'MCP One' });
    expect(optionLabels()).toEqual(['MCP One']);
  });

  test('Model Serving filter shows only text-classification inference containers', async () => {
    renderWithFilter(isTextClassificationInferenceContainer);
    await screen.findByRole('option', { name: 'Classifier' });
    expect(optionLabels()).toEqual(['Classifier']);
  });
});
