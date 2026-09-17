import { FC, useState } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ActionMenuOperationI18nKey, ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import MethodTabContent from '../MethodTabContent';

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getDeployment: vi.fn().mockResolvedValue(null),
  getDeploymentById: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/src/components/TestSuites/View/RequestDynamicConfiguration', () => ({
  default: ({ requestView, onChangeRequestView, title }: any) => (
    <div>
      <span>RequestDynamicConfiguration:{requestView.endpointRef?.relativeUrlPattern ?? 'none'}</span>
      <span>RequestDynamicConfigurationTitle:{title ?? 'none'}</span>
      <button
        type="button"
        onClick={() => onChangeRequestView({ ...requestView, requestTemplate: { urlTemplate: 'changed' } }, true)}
      >
        Change Dynamic Configuration
      </button>
    </div>
  ),
}));

vi.mock('@/src/components/TestSuites/EndpointSchema/EndpointSchema', () => ({
  default: ({ testSuite, jsonataVariables }: any) => (
    <div>
      <span>EndpointSchema:{testSuite.endpointRef?.relativeUrlPattern ?? 'none'}</span>
      <span>EndpointSchemaVariables:{(jsonataVariables ?? []).map((v: any) => v.name).join(',')}</span>
    </div>
  ),
}));

vi.mock('@/src/components/TestSuites/Modals/EditRequestWizard/EditRequestWizard', () => ({
  default: ({ isNewRequest }: any) => <div>EditRequestWizard:{isNewRequest ? 'new' : 'edit'}</div>,
}));

vi.mock('@/src/components/TestSuites/RequestTemplate/components/TryOutButton', () => ({
  default: () => <button type="button">TryOut</button>,
}));

const baseSuite: TestSuite = {
  id: 'suite-1',
  suiteType: SuiteType.Deployment,
  requestName: 'Main request',
  endpointRef: { method: 'POST', relativeUrlPattern: '/v1/main' },
  deploymentRef: { id: 'deployment-1', name: 'Deployment 1' },
  additionalRequests: [{ name: 'Second', endpointRef: { method: 'GET', relativeUrlPattern: '/v1/second' } }],
};

const Harness: FC<{ initialSuite: TestSuite; onChange?: (suite: TestSuite, isSkipRefresh?: boolean) => void }> = ({
  initialSuite,
  onChange,
}) => {
  const [suite, setSuite] = useState(initialSuite);

  return (
    <MethodTabContent
      testSuite={suite}
      onChange={(updated, isSkipRefresh) => {
        setSuite(updated);
        onChange?.(updated, isSkipRefresh);
      }}
    />
  );
};

describe('MethodTabContent - request chain', () => {
  test('renders request chips for the suite and its additional requests', () => {
    render(<Harness initialSuite={baseSuite} />);

    expect(screen.getByText('Main request')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  test('shows the selected request data in Dynamic Configuration and EndpointSchema', async () => {
    const user = userEvent.setup();
    render(<Harness initialSuite={baseSuite} />);

    expect(screen.getByText('RequestDynamicConfiguration:/v1/main')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Second' }));

    expect(screen.getByText('RequestDynamicConfiguration:/v1/second')).toBeInTheDocument();
    expect(screen.getByText('EndpointSchema:/v1/second')).toBeInTheDocument();
    expect(screen.queryByText('RequestDynamicConfiguration:/v1/main')).not.toBeInTheDocument();
  });

  test('always titles Dynamic Configuration with the static heading, regardless of the chain', async () => {
    const user = userEvent.setup();
    render(<Harness initialSuite={baseSuite} />);

    expect(
      screen.getByText(`RequestDynamicConfigurationTitle:${TestSuitesI18nKey.DynamicConfiguration}`),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Second' }));

    expect(
      screen.getByText(`RequestDynamicConfigurationTitle:${TestSuitesI18nKey.DynamicConfiguration}`),
    ).toBeInTheDocument();
  });

  test('renders TryOutButton only for the first request', async () => {
    const user = userEvent.setup();
    render(<Harness initialSuite={baseSuite} />);

    expect(screen.getByText('TryOut')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Second' }));

    expect(screen.queryByText('TryOut')).not.toBeInTheDocument();
  });

  test('shows the previous-outputs info banner only for requests after the first', async () => {
    const user = userEvent.setup();
    render(<Harness initialSuite={baseSuite} />);

    expect(screen.queryByText(TestSuitesI18nKey.RequestChainPreviousOutputsInfo)).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Second' }));

    expect(screen.getByText(TestSuitesI18nKey.RequestChainPreviousOutputsInfo)).toBeInTheDocument();
  });

  test('passes the previous requests output columns to EndpointSchema as JSONata variables', async () => {
    const user = userEvent.setup();
    const suiteWithColumns: TestSuite = {
      ...baseSuite,
      responseColumns: [{ name: 'answer', displayName: 'Answer', expression: 'answer', type: 'string' }],
    };
    render(<Harness initialSuite={suiteWithColumns} />);

    expect(screen.getByText('EndpointSchemaVariables:')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Second' }));

    expect(screen.getByText('EndpointSchemaVariables:answer')).toBeInTheDocument();
  });

  test('lists the previous requests response column names in the info banner when there are any', async () => {
    const user = userEvent.setup();
    const suiteWithColumns: TestSuite = {
      ...baseSuite,
      responseColumns: [{ name: 'answer', displayName: 'Answer', expression: 'answer', type: 'string' }],
    };
    render(<Harness initialSuite={suiteWithColumns} />);

    await user.click(screen.getByRole('tab', { name: 'Second' }));

    expect(screen.getByText(TestSuitesI18nKey.RequestChainPreviousOutputsColumnsInfo)).toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.RequestChainPreviousOutputsInfo)).not.toBeInTheDocument();
  });

  test('adding a request appends an entry, selects it, and opens the wizard as a new request', async () => {
    const user = userEvent.setup();
    render(<Harness initialSuite={baseSuite} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

    expect(screen.getByText(`${TestSuitesI18nKey.Request} 3`)).toBeInTheDocument();
    expect(screen.getByText('RequestDynamicConfiguration:none')).toBeInTheDocument();
    expect(screen.getByText('EditRequestWizard:new')).toBeInTheDocument();
  });

  test('opens the wizard for editing (not as a new request) via the Edit request button', async () => {
    const user = userEvent.setup();
    render(<Harness initialSuite={baseSuite} />);

    expect(screen.queryByText(/EditRequestWizard:/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: TestSuitesI18nKey.EditRequest }));

    expect(screen.getByText('EditRequestWizard:edit')).toBeInTheDocument();
  });

  test('removing a request drops the chip and reselects the previous one', async () => {
    const user = userEvent.setup();
    render(<Harness initialSuite={baseSuite} />);

    await user.click(screen.getByRole('tab', { name: 'Second' }));
    const actionTriggers = screen.getAllByRole('button', { name: ButtonsI18nKey.Actions });
    await user.click(actionTriggers[1]);
    await user.click(screen.getByRole('menuitem', { name: ActionMenuOperationI18nKey.Delete }));

    expect(screen.queryByText('Second')).not.toBeInTheDocument();
    expect(screen.getByText('RequestDynamicConfiguration:/v1/main')).toBeInTheDocument();
    expect(screen.getAllByText(/RequestDynamicConfiguration:/)).toHaveLength(1);
  });

  test('renaming a request via the sidebar menu propagates the new name', async () => {
    const user = userEvent.setup();
    render(<Harness initialSuite={baseSuite} />);

    const actionTriggers = screen.getAllByRole('button', { name: ButtonsI18nKey.Actions });
    await user.click(actionTriggers[1]);
    await user.click(screen.getByRole('menuitem', { name: ActionMenuOperationI18nKey.Rename }));
    fireEvent.change(screen.getByDisplayValue('Second'), { target: { value: 'Renamed request' } });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Confirm }));

    expect(screen.getByText('Renamed request')).toBeInTheDocument();
  });

  test('clamps the selection when an external reset shrinks the request chain', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<MethodTabContent testSuite={baseSuite} onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: 'Second' }));
    expect(screen.getByText('RequestDynamicConfiguration:/v1/second')).toBeInTheDocument();

    // Simulates an external reset (e.g. discard changes) replacing the suite prop with a shorter
    // chain, independent of this component's own onChange.
    const shrunkSuite: TestSuite = { ...baseSuite, additionalRequests: [] };
    rerender(<MethodTabContent testSuite={shrunkSuite} onChange={onChange} />);

    expect(screen.queryByText('Second')).not.toBeInTheDocument();
    expect(screen.getByText('RequestDynamicConfiguration:/v1/main')).toBeInTheDocument();
    expect(screen.getByText('TryOut')).toBeInTheDocument();
  });

  test('forwards isSkipRefresh from request-scoped editors through the proxy view', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initialSuite={baseSuite} onChange={onChange} />);

    await user.click(screen.getByText('Change Dynamic Configuration'));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'suite-1' }), true);
  });
});
