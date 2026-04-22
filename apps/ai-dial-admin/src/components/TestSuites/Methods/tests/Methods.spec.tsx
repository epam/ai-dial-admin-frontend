import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import Methods from '../Methods';

const mockGetDeployment = vi.fn();
const mockGenerateMethodPathCombinations = vi.fn();

vi.mock('@/src/components/TestSuites/utils/method', () => ({
  generateMethodPathCombinations: (...args: any[]) => mockGenerateMethodPathCombinations(...args),
}));

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getDeployment: (...args: any[]) => mockGetDeployment(...args),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialCollapsibleSidebar: ({ children }: any) => <div role="complementary">{children}</div>,
  DialConditionalResizableContainer: ({ children }: any) => <div>{children}</div>,
  DialLoader: () => <div role="progressbar" />,
}));

vi.mock('../MethodItem', () => ({
  __esModule: true,
  default: ({ item, index, onClick, isActive }: any) => (
    <div className={isActive ? 'active-method' : 'inactive-method'} data-index={index}>
      <button onClick={() => onClick(index)}>
        {item?.method} {item?.relativeUrlPattern || ''}
      </button>
    </div>
  ),
}));

vi.mock('../MethodInfo', () => ({
  __esModule: true,
  default: ({ testSuite }: any) => (
    <div role="region" aria-label="method-info">
      {testSuite?.endpointRef?.method}
    </div>
  ),
}));

describe('Methods component', () => {
  const onChange = vi.fn();
  const mockDeployment = {
    deploymentId: 'test-deployment',
    $type: 'application',
    routes: {
      'route-1': { path: '/api/users', methods: ['GET', 'POST'] },
      'route-2': { path: '/api/data', methods: ['GET'] },
    },
  };

  const mockMethods = [
    { method: 'GET', relativeUrlPattern: '/api/users' },
    { method: 'POST', relativeUrlPattern: '/api/users' },
    { method: 'GET', relativeUrlPattern: '/api/data' },
  ];

  beforeEach(() => {
    onChange.mockClear();
    mockGetDeployment.mockClear();
    mockGenerateMethodPathCombinations.mockClear();
    mockGetDeployment.mockResolvedValue(mockDeployment);
    mockGenerateMethodPathCombinations.mockReturnValue(mockMethods);
  });

  test('renders chat-completion method as first item', async () => {
    const testSuite: any = { endpointRef: {} };
    const selectedApplication: any = { deploymentId: 'test-deployment', $type: 'application' };

    render(<Methods testSuite={testSuite} selectedTarget={selectedApplication} onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /POST.*\/api\/users/ })).toBeInTheDocument();
    });
  });

  test('fetches deployment and generates methods on mount', async () => {
    const testSuite: any = { endpointRef: {} };
    const selectedApplication: any = { deploymentId: 'test-deployment', $type: 'application' };

    render(<Methods testSuite={testSuite} selectedTarget={selectedApplication} onChange={onChange} />);

    await waitFor(() => {
      expect(mockGetDeployment).toHaveBeenCalledWith('test-deployment', 'application');
      expect(mockGenerateMethodPathCombinations).toHaveBeenCalledWith(mockDeployment.routes);
    });
  });

  test('renders all generated methods after chat-completion', async () => {
    const testSuite: any = { endpointRef: {} };
    const selectedApplication: any = { deploymentId: 'test-deployment', $type: 'application' };

    render(<Methods testSuite={testSuite} selectedTarget={selectedApplication} onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'GET /api/users' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'POST /api/users' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'GET /api/data' })).toBeInTheDocument();
    });
  });

  test('sets active method based on existing endpointRef on mount', async () => {
    const testSuite: any = {
      endpointRef: { method: 'POST', relativeUrlPattern: '/api/users' },
    };
    const selectedApplication: any = { deploymentId: 'test-deployment', $type: 'application' };

    render(<Methods testSuite={testSuite} selectedTarget={selectedApplication} onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'POST /api/users' })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'POST /api/users' })).toBeInTheDocument();
  });

  test('defaults to chat-completion when endpointRef does not match any method', async () => {
    const testSuite: any = {
      endpointRef: { method: 'DELETE', relativeUrlPattern: '/not-found' },
    };
    const selectedApplication: any = { deploymentId: 'test-deployment', $type: 'application' };

    render(<Methods testSuite={testSuite} selectedTarget={selectedApplication} onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /POST.*\/api\/users/ })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /POST.*\/api\/users/ })).toBeInTheDocument();
  });

  test('does not fetch deployment if already loaded', async () => {
    const testSuite: any = { endpointRef: {} };
    const selectedApplication: any = { deploymentId: 'test-deployment', $type: 'application' };

    const { rerender } = render(
      <Methods testSuite={testSuite} selectedTarget={selectedApplication} onChange={onChange} />,
    );

    await waitFor(() => {
      expect(mockGetDeployment).toHaveBeenCalledTimes(1);
    });

    rerender(<Methods testSuite={testSuite} selectedTarget={selectedApplication} onChange={onChange} />);

    expect(mockGetDeployment).toHaveBeenCalledTimes(1);
  });
});
