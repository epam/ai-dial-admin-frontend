import { FC, useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import MethodTabContent from '../MethodTabContent';

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getDeployments: vi.fn().mockResolvedValue({ success: true, response: [] }),
}));

vi.mock('@/src/components/TestSuites/RequestTemplate/RequestTemplate', () => ({
  default: ({ testSuite, onChangeTestSuite }: any) => (
    <div>
      <span>RequestTemplate:{testSuite.endpointRef?.relativeUrlPattern ?? 'none'}</span>
      <button
        type="button"
        onClick={() => onChangeTestSuite({ ...testSuite, requestTemplate: { urlTemplate: 'changed' } }, true)}
      >
        Change Request Template
      </button>
    </div>
  ),
}));

vi.mock('@/src/components/TestSuites/EndpointSchema/EndpointSchema', () => ({
  default: ({ testSuite }: any) => <div>EndpointSchema:{testSuite.endpointRef?.relativeUrlPattern ?? 'none'}</div>,
}));

vi.mock('@/src/components/TestSuites/Modals/ChangeMethodModal/ChangeMethodModal', () => ({
  default: () => <div>ChangeMethodModal</div>,
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

    expect(screen.getByText('1. Main request')).toBeInTheDocument();
    expect(screen.getByText('2. Second')).toBeInTheDocument();
  });

  test('shows the selected request data in RequestTemplate and EndpointSchema', async () => {
    const user = userEvent.setup();
    render(<Harness initialSuite={baseSuite} />);

    expect(screen.getByText('RequestTemplate:/v1/main')).toBeInTheDocument();

    await user.click(screen.getByText('2. Second'));

    expect(screen.getByText('RequestTemplate:/v1/second')).toBeInTheDocument();
    expect(screen.getByText('EndpointSchema:/v1/second')).toBeInTheDocument();
    expect(screen.queryByText('RequestTemplate:/v1/main')).not.toBeInTheDocument();
  });

  test('renders TryOutButton only for the first request', async () => {
    const user = userEvent.setup();
    render(<Harness initialSuite={baseSuite} />);

    expect(screen.getByText('TryOut')).toBeInTheDocument();

    await user.click(screen.getByText('2. Second'));

    expect(screen.queryByText('TryOut')).not.toBeInTheDocument();
  });

  test('shows the previous-outputs info banner only for requests after the first', async () => {
    const user = userEvent.setup();
    render(<Harness initialSuite={baseSuite} />);

    expect(screen.queryByText(TestSuitesI18nKey.RequestChainPreviousOutputsInfo)).not.toBeInTheDocument();

    await user.click(screen.getByText('2. Second'));

    expect(screen.getByText(TestSuitesI18nKey.RequestChainPreviousOutputsInfo)).toBeInTheDocument();
  });

  test('adding a request appends an entry and selects it', async () => {
    const user = userEvent.setup();
    render(<Harness initialSuite={baseSuite} />);

    await user.click(screen.getByRole('button', { name: TestSuitesI18nKey.AddRequest }));

    expect(screen.getByText(`3. ${TestSuitesI18nKey.Request}`)).toBeInTheDocument();
    expect(screen.getByText('RequestTemplate:none')).toBeInTheDocument();
  });

  test('removing a request drops the chip and reselects the previous one', async () => {
    const user = userEvent.setup();
    render(<Harness initialSuite={baseSuite} />);

    await user.click(screen.getByText('2. Second'));
    const removeButtons = screen.getAllByRole('button', { name: TestSuitesI18nKey.RemoveRequest });
    await user.click(removeButtons[0]);

    expect(screen.queryByText('2. Second')).not.toBeInTheDocument();
    expect(screen.getByText('RequestTemplate:/v1/main')).toBeInTheDocument();
    expect(screen.getAllByText(/RequestTemplate:/)).toHaveLength(1);
  });

  test('forwards isSkipRefresh from request-scoped editors through the proxy view', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initialSuite={baseSuite} onChange={onChange} />);

    await user.click(screen.getByText('Change Request Template'));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'suite-1' }), true);
  });
});
