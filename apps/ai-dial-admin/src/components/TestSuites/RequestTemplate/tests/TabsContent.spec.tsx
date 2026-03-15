import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { BasicI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { TestSuite, TestSuiteRequestTemplate } from '@/src/models/evaluation/test-suite';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../tabs/TabsContent';

vi.mock('../tabs/BodyTab', () => ({
  default: ({ template, changeTemplate }: any) => (
    <div role="region" aria-label="body-tab">
      <span>Body: {JSON.stringify(template.body ?? null)}</span>
      <button onClick={() => changeTemplate({ ...template, body: { updated: true } })}>EditBody</button>
    </div>
  ),
}));

vi.mock('../tabs/ParamsTab', () => ({
  default: ({ template, changeTemplate, field, title, emptyDataTitle }: any) => (
    <div role="region" aria-label={`params-tab-${field}`}>
      <span>Title: {title}</span>
      <span>Empty: {emptyDataTitle}</span>
      <span>Field: {field}</span>
      <button onClick={() => changeTemplate({ ...template, [field]: [{ key: 'k', value: 'v' }] })}>
        EditParams-{field}
      </button>
    </div>
  ),
}));

const createTestSuite = (overrides?: Partial<TestSuite>): TestSuite => ({
  id: 'suite-1',
  name: 'Test Suite 1',
  requestTemplate: { urlTemplate: '/api', body: {}, headers: [], queryParams: [] },
  ...overrides,
});

describe('TabsContent', () => {
  let mockOnChange: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChange = vi.fn();
  });

  test('renders BodyTab when activeTab is Body', () => {
    render(
      <TabsContent activeTab={EntityViewTab.Body} selectedTestSuite={createTestSuite()} onChange={mockOnChange} />,
    );

    expect(screen.getByRole('region', { name: 'body-tab' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'params-tab-queryParams' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'params-tab-headers' })).not.toBeInTheDocument();
  });

  test('renders ParamsTab with queryParams field when activeTab is Parameters', () => {
    render(
      <TabsContent
        activeTab={EntityViewTab.Parameters}
        selectedTestSuite={createTestSuite()}
        onChange={mockOnChange}
      />,
    );

    expect(screen.getByRole('region', { name: 'params-tab-queryParams' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'body-tab' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'params-tab-headers' })).not.toBeInTheDocument();
  });

  test('renders ParamsTab with headers field when activeTab is Headers', () => {
    render(
      <TabsContent activeTab={EntityViewTab.Headers} selectedTestSuite={createTestSuite()} onChange={mockOnChange} />,
    );

    expect(screen.getByRole('region', { name: 'params-tab-headers' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'body-tab' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'params-tab-queryParams' })).not.toBeInTheDocument();
  });

  test('does not render any tab content for an unrelated activeTab', () => {
    render(
      <TabsContent activeTab={EntityViewTab.TestCases} selectedTestSuite={createTestSuite()} onChange={mockOnChange} />,
    );

    expect(screen.queryByRole('region', { name: 'body-tab' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'params-tab-queryParams' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'params-tab-headers' })).not.toBeInTheDocument();
  });

  test('passes correct title and emptyDataTitle to Parameters ParamsTab', () => {
    render(
      <TabsContent
        activeTab={EntityViewTab.Parameters}
        selectedTestSuite={createTestSuite()}
        onChange={mockOnChange}
      />,
    );

    expect(screen.getByText(`Empty: ${BasicI18nKey.NoParameters}`)).toBeInTheDocument();
  });

  test('passes field="queryParams" to Parameters ParamsTab', () => {
    render(
      <TabsContent
        activeTab={EntityViewTab.Parameters}
        selectedTestSuite={createTestSuite()}
        onChange={mockOnChange}
      />,
    );

    expect(screen.getByText('Field: queryParams')).toBeInTheDocument();
  });

  test('passes field="headers" to Headers ParamsTab', () => {
    render(
      <TabsContent activeTab={EntityViewTab.Headers} selectedTestSuite={createTestSuite()} onChange={mockOnChange} />,
    );

    expect(screen.getByText('Field: headers')).toBeInTheDocument();
  });

  test('BodyTab changeTemplate calls onChange with updated requestTemplate', () => {
    const testSuite = createTestSuite({ name: 'MySuite' });

    render(<TabsContent activeTab={EntityViewTab.Body} selectedTestSuite={testSuite} onChange={mockOnChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'EditBody' }));

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'MySuite',
        requestTemplate: expect.objectContaining({ body: { updated: true } }),
      }),
    );
  });

  test('Parameters ParamsTab changeTemplate calls onChange with updated requestTemplate', () => {
    const testSuite = createTestSuite();

    render(<TabsContent activeTab={EntityViewTab.Parameters} selectedTestSuite={testSuite} onChange={mockOnChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'EditParams-queryParams' }));

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        requestTemplate: expect.objectContaining({ queryParams: [{ key: 'k', value: 'v' }] }),
      }),
    );
  });

  test('Headers ParamsTab changeTemplate calls onChange with updated requestTemplate', () => {
    const testSuite = createTestSuite();

    render(<TabsContent activeTab={EntityViewTab.Headers} selectedTestSuite={testSuite} onChange={mockOnChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'EditParams-headers' }));

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        requestTemplate: expect.objectContaining({ headers: [{ key: 'k', value: 'v' }] }),
      }),
    );
  });

  test('uses empty object fallback when requestTemplate is undefined', () => {
    const testSuite = createTestSuite({ requestTemplate: undefined });

    render(<TabsContent activeTab={EntityViewTab.Body} selectedTestSuite={testSuite} onChange={mockOnChange} />);

    expect(screen.getByRole('region', { name: 'body-tab' })).toBeInTheDocument();
    expect(screen.getByText('Body: null')).toBeInTheDocument();
  });

  test('renders with correct container class', () => {
    const { container } = render(
      <TabsContent activeTab={EntityViewTab.Body} selectedTestSuite={createTestSuite()} onChange={mockOnChange} />,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex-1', 'min-h-0');
  });
});
