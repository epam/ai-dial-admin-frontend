import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { CREATE_RESPONSE_METHOD } from '@/src/components/TestSuites/constants/responses-method';
import { Deployment } from '@/src/models/evaluation/deployment';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import Target from '../Target';

const deployment: Deployment = {
  $type: 'dial-application',
  deploymentId: 'new-target',
  displayName: 'New target',
};
const getDeploymentsMock = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getDeployments: (...args: unknown[]) => getDeploymentsMock(...args),
}));

vi.mock('@/src/components/Grid/GridView/RadioSelectGrid', () => ({
  default: ({ onSelect }: { onSelect: (selected: Deployment) => void }) => (
    <button type="button" onClick={() => onSelect(deployment)}>
      Select target
    </button>
  ),
}));

describe('Target', () => {
  beforeEach(() => {
    getDeploymentsMock.mockReset();
    getDeploymentsMock.mockResolvedValue({ response: [] });
  });

  test('updates the target and reseeds its request model in one state update', async () => {
    const user = userEvent.setup();
    const onChangeTarget = vi.fn();
    const onChange = vi.fn();
    const suite = {
      endpointRef: CREATE_RESPONSE_METHOD,
      requestTemplate: { body: { content: { model: 'old-target', input: 'hello' } } },
    } as TestSuite;

    render(<Target onChangeTarget={onChangeTarget} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Select target' }));

    expect(onChangeTarget).toHaveBeenCalledWith(deployment);
    expect(onChange).toHaveBeenCalledOnce();

    const update = onChange.mock.calls[0][0] as (previous: TestSuite) => TestSuite;
    const result = update(suite);

    expect(result.deploymentRef?.id).toBe('new-target');
    expect(result.requestTemplate?.body?.content).toEqual({ model: 'new-target', input: 'hello' });
  });
});
