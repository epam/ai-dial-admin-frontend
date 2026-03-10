import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { TemplateVariable } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import TryOut from '../components/TryOut';

const mockgetTestSuiteTemplateVariables = vi.fn();
const mocktryOutTestSuite = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getTestSuiteTemplateVariables: (...args: unknown[]) => mockgetTestSuiteTemplateVariables(...args),
  tryOutTestSuite: (...args: unknown[]) => mocktryOutTestSuite(...args),
}));

const mockCloseSidebar = vi.fn();
const mockToggleSidebar = vi.fn();
const mockToggleIsMenuClosed = vi.fn();

let mockSidebar = {
  show: false,
  content: null,
  isMenuClosed: false,
  closeSidebar: mockCloseSidebar,
  showSidebar: vi.fn(),
  toggleIsMenuClosed: mockToggleIsMenuClosed,
};

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    sidebar: mockSidebar,
    toggleSidebar: mockToggleSidebar,
  }),
}));

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: ({ entity }: { entity: unknown }) => <pre role="code">{JSON.stringify(entity)}</pre>,
}));

vi.mock('../components/Variables', () => ({
  default: ({ variables }: any) => (
    <div role="table">
      {variables.map((v: TemplateVariable) => (
        <span key={v.name}>{v.name}</span>
      ))}
    </div>
  ),
}));

vi.mock('../components/CollapsibleSection', () => ({
  default: ({ title, children }: any) => (
    <section aria-label={title}>
      <h3>{title}</h3>
      {children}
    </section>
  ),
}));

vi.mock('@/src/components/Common/Divider/Divider', () => ({
  default: () => <hr role="separator" />,
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialLoader: () => <div role="progressbar" aria-label="loading" />,
  DialPrimaryButton: ({ label, onClick, disabled }: any) => (
    <button role="button" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  ),
  DialCloseButton: ({ onClose }: any) => (
    <button role="button" aria-label="close" onClick={onClose}>
      Close
    </button>
  ),
}));

const createVariable = (overrides?: Partial<TemplateVariable>): TemplateVariable => ({
  name: 'var1',
  inferredType: TestCaseItemType.STRING,
  defaultValue: null,
  hasDefault: false,
  sources: ['body'],
  ...overrides,
});

describe('TryOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockgetTestSuiteTemplateVariables.mockResolvedValue([]);
    mockSidebar = {
      show: false,
      content: null,
      isMenuClosed: false,
      closeSidebar: mockCloseSidebar,
      showSidebar: vi.fn(),
      toggleIsMenuClosed: mockToggleIsMenuClosed,
    };
  });

  test('shows loader while fetching template variables', () => {
    mockgetTestSuiteTemplateVariables.mockReturnValue(new Promise(() => {}));

    render(<TryOut testSuiteId="suite-1" />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders heading and buttons after loading', async () => {
    mockgetTestSuiteTemplateVariables.mockResolvedValue([]);

    render(<TryOut testSuiteId="suite-1" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(ButtonsI18nKey.TryOut);
    });

    expect(screen.getByRole('button', { name: ButtonsI18nKey.SendRequest })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'close' })).toBeInTheDocument();
  });

  test('calls getTestSuiteTemplateVariables with testSuiteId on mount', () => {
    mockgetTestSuiteTemplateVariables.mockResolvedValue([]);

    render(<TryOut testSuiteId="my-suite" />);

    expect(mockgetTestSuiteTemplateVariables).toHaveBeenCalledWith('my-suite');
    expect(mockgetTestSuiteTemplateVariables).toHaveBeenCalledTimes(1);
  });

  test('displays "NoVariables" message when no variables returned', async () => {
    mockgetTestSuiteTemplateVariables.mockResolvedValue([]);

    render(<TryOut testSuiteId="suite-1" />);

    await waitFor(() => {
      expect(screen.getByText(BasicI18nKey.NoVariables)).toBeInTheDocument();
    });
  });

  test('renders Variables component when variables exist', async () => {
    const variables = [createVariable({ name: 'myVar' }), createVariable({ name: 'otherVar' })];
    mockgetTestSuiteTemplateVariables.mockResolvedValue(variables);

    render(<TryOut testSuiteId="suite-1" />);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    expect(screen.getByText('myVar')).toBeInTheDocument();
    expect(screen.getByText('otherVar')).toBeInTheDocument();
  });

  test('renders three collapsible sections: Variables, Request, Response', async () => {
    mockgetTestSuiteTemplateVariables.mockResolvedValue([]);

    render(<TryOut testSuiteId="suite-1" />);

    await waitFor(() => {
      expect(screen.getByRole('region', { name: BasicI18nKey.Variables })).toBeInTheDocument();
    });

    expect(screen.getByRole('region', { name: BasicI18nKey.Request })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: BasicI18nKey.Response })).toBeInTheDocument();
  });

  test('renders JsonEditors for request and response sections', async () => {
    mockgetTestSuiteTemplateVariables.mockResolvedValue([]);

    render(<TryOut testSuiteId="suite-1" />);

    await waitFor(() => {
      const editors = screen.getAllByRole('code');
      expect(editors).toHaveLength(2);
    });
  });

  test('renders divider between Variables and Request sections', async () => {
    mockgetTestSuiteTemplateVariables.mockResolvedValue([]);

    render(<TryOut testSuiteId="suite-1" />);

    await waitFor(() => {
      expect(screen.getByRole('separator')).toBeInTheDocument();
    });
  });

  test('close button calls closeSidebar when menu is not closed', async () => {
    mockSidebar.isMenuClosed = false;
    mockgetTestSuiteTemplateVariables.mockResolvedValue([]);

    render(<TryOut testSuiteId="suite-1" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'close' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'close' }));

    expect(mockCloseSidebar).toHaveBeenCalledTimes(1);
    expect(mockToggleSidebar).not.toHaveBeenCalled();
  });

  test('close button toggles sidebar and menu when isMenuClosed is true', async () => {
    mockSidebar.isMenuClosed = true;
    mockgetTestSuiteTemplateVariables.mockResolvedValue([]);

    render(<TryOut testSuiteId="suite-1" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'close' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'close' }));

    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
    expect(mockToggleIsMenuClosed).toHaveBeenCalledTimes(1);
    expect(mockCloseSidebar).toHaveBeenCalledTimes(1);
  });

  test('send request button is not disabled initially', async () => {
    mockgetTestSuiteTemplateVariables.mockResolvedValue([]);

    render(<TryOut testSuiteId="suite-1" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: ButtonsI18nKey.SendRequest })).not.toBeDisabled();
    });
  });

  test('resolved request is initially empty object', async () => {
    mockgetTestSuiteTemplateVariables.mockResolvedValue([]);

    render(<TryOut testSuiteId="suite-1" />);

    await waitFor(() => {
      const editors = screen.getAllByRole('code');
      const requestEditor = editors[0];
      expect(requestEditor).toHaveTextContent('{}');
    });
  });

  test('response body is initially empty object', async () => {
    mockgetTestSuiteTemplateVariables.mockResolvedValue([]);

    render(<TryOut testSuiteId="suite-1" />);

    await waitFor(() => {
      const editors = screen.getAllByRole('code');
      const responseEditor = editors[1];
      expect(responseEditor).toHaveTextContent('{}');
    });
  });

  test('handles null response from getTestSuiteTemplateVariables', async () => {
    mockgetTestSuiteTemplateVariables.mockResolvedValue(null);

    render(<TryOut testSuiteId="suite-1" />);

    await waitFor(() => {
      expect(screen.getByText(BasicI18nKey.NoVariables)).toBeInTheDocument();
    });
  });

  test('sendRequest calls tryOutTestSuite with testSuiteId and requestBody', async () => {
    mockgetTestSuiteTemplateVariables.mockResolvedValue([createVariable({ name: 'x' })]);
    mocktryOutTestSuite.mockResolvedValue({ success: true, response: { resolvedRequest: {}, response: {} } });

    render(<TryOut testSuiteId="suite-1" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: ButtonsI18nKey.SendRequest })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.SendRequest }));

    expect(mocktryOutTestSuite).toHaveBeenCalledWith('suite-1', { x: '' });
  });

  test('sendRequest success populates resolvedRequest and response', async () => {
    mockgetTestSuiteTemplateVariables.mockResolvedValue([]);
    mocktryOutTestSuite.mockResolvedValue({
      success: true,
      response: {
        resolvedRequest: { resolved: 'req' },
        response: { data: 'ok' },
      },
    });

    render(<TryOut testSuiteId="suite-1" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: ButtonsI18nKey.SendRequest })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.SendRequest }));

    await waitFor(() => {
      const editors = screen.getAllByRole('code');
      expect(editors[0]).toHaveTextContent('{"resolved":"req"}');
      expect(editors[1]).toHaveTextContent('{"data":"ok"}');
    });
  });

  test('sendRequest error sets response with error message and resolvedRequest to requestBody', async () => {
    mockgetTestSuiteTemplateVariables.mockResolvedValue([createVariable({ name: 'v' })]);
    mocktryOutTestSuite.mockResolvedValue({
      success: false,
      errorMessage: 'Something went wrong',
    });

    render(<TryOut testSuiteId="suite-1" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: ButtonsI18nKey.SendRequest })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.SendRequest }));

    await waitFor(() => {
      const editors = screen.getAllByRole('code');
      expect(editors[0]).toHaveTextContent('{"v":""}');
      expect(editors[1]).toHaveTextContent('{"error":"Something went wrong"}');
    });
  });

  test('sendRequest error uses default message when errorMessage is missing', async () => {
    mockgetTestSuiteTemplateVariables.mockResolvedValue([]);
    mocktryOutTestSuite.mockResolvedValue({ success: false });

    render(<TryOut testSuiteId="suite-1" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: ButtonsI18nKey.SendRequest })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.SendRequest }));

    await waitFor(() => {
      const editors = screen.getAllByRole('code');
      expect(editors[1]).toHaveTextContent('{"error":"Unknown error"}');
    });
  });

  test('sendRequest success with empty response fields defaults to empty objects', async () => {
    mockgetTestSuiteTemplateVariables.mockResolvedValue([]);
    mocktryOutTestSuite.mockResolvedValue({
      success: true,
      response: {},
    });

    render(<TryOut testSuiteId="suite-1" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: ButtonsI18nKey.SendRequest })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.SendRequest }));

    await waitFor(() => {
      const editors = screen.getAllByRole('code');
      expect(editors[0]).toHaveTextContent('{}');
      expect(editors[1]).toHaveTextContent('{}');
    });
  });
});
