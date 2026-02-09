import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Methods from '../Methods';

vi.mock('@/src/locales/client', () => ({
  useI18n: () => (k: string) => k,
}));

vi.mock('@/src/components/TestSuites/utils/method', () => ({
  generateMethodPathCombinations: vi.fn(() => [
    { method: 'GET', relativeUrl: '/api' },
    { method: 'POST', relativeUrl: '/data' },
  ]),
}));

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getDeployment: vi.fn(() => Promise.resolve({ deploymentId: 'd', $type: 't' })),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialCollapsibleSidebar: ({ children }: any) => <div data-testid="sidebar">{children}</div>,
}));

vi.mock('../MethodItem', () => ({
  __esModule: true,
  default: ({ item, index, onClick }: any) => (
    <button data-testid={`method-${index}`} onClick={() => onClick(index)}>
      {item?.method ?? `CHAT-${index}`}
    </button>
  ),
}));

vi.mock('../MethodInfo', () => ({
  __esModule: true,
  default: ({ endpoint }: any) => <div data-testid="method-info">{JSON.stringify(endpoint)}</div>,
}));

describe('Methods component', () => {
  const onChange = vi.fn();
  const baseTestSuite: any = { endpointRef: {} };
  const selectedApplication: any = { deploymentId: 'd', $type: 't', routes: { r1: {} } };

  beforeEach(() => {
    onChange.mockClear();
  });

  test('renders chat-completion item and generated methods', () => {
    render(<Methods testSuite={baseTestSuite} selectedApplication={selectedApplication} onChange={onChange} />);

    expect(screen.getByTestId('method-0')).toBeInTheDocument();
    expect(screen.getByTestId('method-1')).toBeInTheDocument();
    expect(screen.getByTestId('method-2')).toBeInTheDocument();
  });

  test('clicking generated method calls onChange updater with correct endpointRef', () => {
    render(<Methods testSuite={baseTestSuite} selectedApplication={selectedApplication} onChange={onChange} />);

    const genMethodButton = screen.getByTestId('method-1');
    fireEvent.click(genMethodButton);

    expect(onChange).toHaveBeenCalledTimes(1);

    const updater = onChange.mock.calls[0][0];
    const newState = updater({ some: 'state' });

    expect(newState.endpointRef).toEqual({ method: 'POST', relativeUrl: '/data' });
  });

  test('clicking chat-completion item sets endpointRef to CHAT_COMPLETION_METHOD', () => {
    render(<Methods testSuite={baseTestSuite} selectedApplication={selectedApplication} onChange={onChange} />);

    const chatButton = screen.getByTestId('method-0');
    fireEvent.click(chatButton);

    expect(onChange).toHaveBeenCalledTimes(1);

    const updater = onChange.mock.calls[0][0];
    const newState = updater({});

    expect(newState.endpointRef).toBeDefined();
  });
});
