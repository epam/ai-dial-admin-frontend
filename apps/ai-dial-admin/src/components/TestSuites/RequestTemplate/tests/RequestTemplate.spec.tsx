import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { ContentType } from '@/src/components/TestSuites/constants/content-type';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import RequestTemplate from '../RequestTemplate';

let capturedTabClick: (id: string) => void;

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialTabs: ({ tabs, activeTab, onClick }: any) => {
    capturedTabClick = onClick;
    return (
      <nav aria-label="tabs">
        {tabs.map((tab: any) => (
          <button key={tab.id} type="button" aria-pressed={activeTab === tab.id} onClick={() => onClick(tab.id)}>
            {tab.label}
          </button>
        ))}
      </nav>
    );
  },
  DialNeutralButton: ({ label, onClick, iconBefore }: any) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
}));

vi.mock('@tabler/icons-react', () => ({
  IconPlus: () => <svg data-icon="plus" />,
}));

const mockAdd = vi.fn();
vi.mock('../tabs/TabsContent', () => ({
  default: ({ activeTab, selectedTestSuite, onChange, ref: _ref }: any, ref: any) => {
    if (ref && typeof ref === 'object') {
      ref.current = { add: mockAdd };
    }
    return (
      <div role="region" aria-label={`tabs-content-${activeTab}`}>
        <span>Suite: {selectedTestSuite?.id}</span>
        <button type="button" onClick={() => onChange({ ...selectedTestSuite, name: 'updated' })}>
          Change
        </button>
      </div>
    );
  },
}));

// Re-mock using forwardRef pattern
vi.mock('../tabs/TabsContent', () => {
  const { forwardRef } = require('react');
  return {
    default: forwardRef(({ activeTab, selectedTestSuite, onChange }: any, ref: any) => {
      if (ref && typeof ref === 'object') {
        ref.current = { add: mockAdd };
      }
      return (
        <div role="region" aria-label={`tabs-content-${activeTab}`}>
          <span>Suite: {selectedTestSuite?.id}</span>
          <button type="button" onClick={() => onChange({ ...selectedTestSuite, name: 'updated' })}>
            Change
          </button>
        </div>
      );
    }),
  };
});

vi.mock('../components/ContentTypeSelect', () => ({
  default: ({ testSuite, onChangeTestSuite }: any) => (
    <div role="combobox" aria-label="content-type-select">
      <span>ContentType: {testSuite?.requestTemplate?.body?.contentType ?? 'none'}</span>
      <button type="button" onClick={() => onChangeTestSuite({ ...testSuite, name: 'ct-changed' })}>
        ChangeContentType
      </button>
    </div>
  ),
}));

vi.mock('@/src/utils/tabs/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/src/utils/tabs/utils')>();
  return {
    ...actual,
    getTestSuiteRequestTemplateTabs: (_t: any) => [
      { id: actual.EntityViewTab.Body, label: 'Body' },
      { id: actual.EntityViewTab.Parameters, label: 'Parameters' },
      { id: actual.EntityViewTab.Headers, label: 'Headers' },
    ],
  };
});

const createTestSuite = (overrides?: Partial<TestSuite>): TestSuite => ({
  id: 'suite-1',
  name: 'My Suite',
  requestTemplate: { urlTemplate: '/api', body: {}, headers: [], queryParams: [] },
  ...overrides,
});

describe('RequestTemplate', () => {
  let mockOnChangeTestSuite: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChangeTestSuite = vi.fn();
  });

  test('renders the RequestTemplate heading', () => {
    render(<RequestTemplate testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(TestSuitesI18nKey.RequestTemplate);
  });

  test('renders ContentTypeSelect', () => {
    render(<RequestTemplate testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.getByRole('combobox', { name: 'content-type-select' })).toBeInTheDocument();
  });

  test('renders tabs navigation', () => {
    render(<RequestTemplate testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.getByRole('navigation', { name: 'tabs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Body' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Parameters' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Headers' })).toBeInTheDocument();
  });

  test('defaults to Body tab active', () => {
    render(<RequestTemplate testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    expect(screen.getByRole('button', { name: 'Body' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('region', { name: `tabs-content-${EntityViewTab.Body}` })).toBeInTheDocument();
  });

  test('does not show Add button when Body tab is JSON', () => {
    render(
      <RequestTemplate
        testSuite={createTestSuite({
          requestTemplate: {
            urlTemplate: '/api',
            body: { contentType: ContentType.JSON, content: {} },
            headers: [],
            queryParams: [],
          },
        })}
        onChangeTestSuite={mockOnChangeTestSuite}
      />,
    );

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Add })).not.toBeInTheDocument();
  });

  test('shows Add button when Body tab is form-data', () => {
    render(
      <RequestTemplate
        testSuite={createTestSuite({
          requestTemplate: {
            urlTemplate: '/api',
            body: { contentType: ContentType.FormData, content: [] },
            headers: [],
            queryParams: [],
          },
        })}
        onChangeTestSuite={mockOnChangeTestSuite}
      />,
    );

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Add })).toBeInTheDocument();
  });

  test('shows Add button when Parameters tab is active', () => {
    render(<RequestTemplate testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    fireEvent.click(screen.getByRole('button', { name: 'Parameters' }));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Add })).toBeInTheDocument();
  });

  test('shows Add button when Headers tab is active', () => {
    render(<RequestTemplate testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    fireEvent.click(screen.getByRole('button', { name: 'Headers' }));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Add })).toBeInTheDocument();
  });

  test('switching to Parameters tab renders TabsContent with Parameters activeTab', () => {
    render(<RequestTemplate testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    fireEvent.click(screen.getByRole('button', { name: 'Parameters' }));

    expect(screen.getByRole('region', { name: `tabs-content-${EntityViewTab.Parameters}` })).toBeInTheDocument();
  });

  test('switching to Headers tab renders TabsContent with Headers activeTab', () => {
    render(<RequestTemplate testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    fireEvent.click(screen.getByRole('button', { name: 'Headers' }));

    expect(screen.getByRole('region', { name: `tabs-content-${EntityViewTab.Headers}` })).toBeInTheDocument();
  });

  test('Add button calls tabsContentRef.current.add on Parameters tab', () => {
    render(<RequestTemplate testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    fireEvent.click(screen.getByRole('button', { name: 'Parameters' }));
    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

    expect(mockAdd).toHaveBeenCalledTimes(1);
  });

  test('Add button on Body (form-data) calls tabsContentRef.current.add', () => {
    render(
      <RequestTemplate
        testSuite={createTestSuite({
          requestTemplate: {
            urlTemplate: '/api',
            body: { contentType: ContentType.FormData, content: [] },
            headers: [],
            queryParams: [],
          },
        })}
        onChangeTestSuite={mockOnChangeTestSuite}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

    expect(mockAdd).toHaveBeenCalledTimes(1);
  });

  test('TabsContent onChange calls onChangeTestSuite', () => {
    const suite = createTestSuite();
    render(<RequestTemplate testSuite={suite} onChangeTestSuite={mockOnChangeTestSuite} />);

    fireEvent.click(screen.getByRole('button', { name: 'Change' }));

    expect(mockOnChangeTestSuite).toHaveBeenCalledTimes(1);
    expect(mockOnChangeTestSuite).toHaveBeenCalledWith(expect.objectContaining({ name: 'updated' }));
  });

  test('ContentTypeSelect onChangeTestSuite calls onChangeTestSuite', () => {
    render(<RequestTemplate testSuite={createTestSuite()} onChangeTestSuite={mockOnChangeTestSuite} />);

    fireEvent.click(screen.getByRole('button', { name: 'ChangeContentType' }));

    expect(mockOnChangeTestSuite).toHaveBeenCalledTimes(1);
    expect(mockOnChangeTestSuite).toHaveBeenCalledWith(expect.objectContaining({ name: 'ct-changed' }));
  });

  test('passes testSuite to TabsContent as selectedTestSuite', () => {
    render(
      <RequestTemplate testSuite={createTestSuite({ id: 'suite-42' })} onChangeTestSuite={mockOnChangeTestSuite} />,
    );

    expect(screen.getByText('Suite: suite-42')).toBeInTheDocument();
  });
});
