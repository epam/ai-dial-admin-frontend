import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import TabsContent from '../TabsContent';

// Mock child components
vi.mock('@/src/components/Common/LabelledText/LabelledText', () => ({
  default: ({ label, text, copyable }: any) => (
    <div>
      <span>Label: {label}</span>
      <span>Text: {text}</span>
      <span>Copyable: {copyable.toString()}</span>
    </div>
  ),
}));

vi.mock('../TestCases/TestCases', () => ({
  default: ({ selectedTestSuite, onChange }: any) => (
    <div>
      <div>Test Cases Component</div>
      <div>Suite: {selectedTestSuite.name}</div>
      <button onClick={() => onChange({ ...selectedTestSuite, name: 'Updated from TestCases' })}>
        Update from TestCases
      </button>
    </div>
  ),
}));

vi.mock('../Properties/Properties', () => ({
  default: ({ testSuite, onChange }: any) => (
    <div>
      <div>Properties Component</div>
      <div>Suite: {testSuite.name}</div>
      <button onClick={() => onChange({ ...testSuite, name: 'Updated from Properties' })}>
        Update from Properties
      </button>
    </div>
  ),
}));

vi.mock('@/src/components/EntityTabs/PropertiesTabContent', () => ({
  default: ({ headerPrefix, entity, view, id, children }: any) => (
    <div>
      <div>Properties Tab Content</div>
      <div>View: {view}</div>
      <div>ID: {id}</div>
      <div>Entity: {entity.name}</div>
      <div>{headerPrefix}</div>
      <div>{children}</div>
    </div>
  ),
}));

describe('TabsContent', () => {
  const mockTestSuite: TestSuite = {
    id: 'test-suite-1',
    name: 'Test Suite 1',
    description: 'Test description',
    status: 'active',
    createdBy: 'user@example.com',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-02',
  };

  const mockOnChange = vi.fn();

  test('renders correct view and id in Properties tab', () => {
    render(
      <TabsContent activeTab={EntityViewTab.Properties} selectedTestSuite={mockTestSuite} onChange={mockOnChange} />,
    );

    expect(screen.getByText(`View: ${ApplicationRoute.TestSuites}`)).toBeInTheDocument();
    expect(screen.getByText('ID: test-suite-1')).toBeInTheDocument();
  });

  test('renders headerPrefix with LabelledText in Properties tab', () => {
    render(
      <TabsContent activeTab={EntityViewTab.Properties} selectedTestSuite={mockTestSuite} onChange={mockOnChange} />,
    );

    expect(screen.getByText(`Label: ${EntityFieldsI18nKey.name}`)).toBeInTheDocument();
    expect(screen.getByText('Text: Test Suite 1')).toBeInTheDocument();
    expect(screen.getByText('Copyable: true')).toBeInTheDocument();
  });

  test('renders Runs tab content when activeTab is Runs', () => {
    render(<TabsContent activeTab={EntityViewTab.Runs} selectedTestSuite={mockTestSuite} onChange={mockOnChange} />);

    expect(screen.getByText('Runs')).toBeInTheDocument();
    expect(screen.queryByText('Test Cases Component')).not.toBeInTheDocument();
    expect(screen.queryByText('Properties Tab Content')).not.toBeInTheDocument();
  });

  test('renders Trends tab content when activeTab is Trends', () => {
    render(<TabsContent activeTab={EntityViewTab.Trends} selectedTestSuite={mockTestSuite} onChange={mockOnChange} />);

    expect(screen.getByText('Trends')).toBeInTheDocument();
    expect(screen.queryByText('Test Cases Component')).not.toBeInTheDocument();
    expect(screen.queryByText('Properties Tab Content')).not.toBeInTheDocument();
  });

  test('does not render Properties tab when activeTab is TestCases', () => {
    render(
      <TabsContent activeTab={EntityViewTab.TestCases} selectedTestSuite={mockTestSuite} onChange={mockOnChange} />,
    );

    expect(screen.queryByText('Properties Tab Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Properties Component')).not.toBeInTheDocument();
  });

  test('does not render TestCases tab when activeTab is Properties', () => {
    render(
      <TabsContent activeTab={EntityViewTab.Properties} selectedTestSuite={mockTestSuite} onChange={mockOnChange} />,
    );

    expect(screen.queryByText('Test Cases Component')).not.toBeInTheDocument();
  });

  test('renders with minimal test suite data', () => {
    const minimalTestSuite: TestSuite = {
      id: 'minimal-1',
      name: 'Minimal Suite',
    };

    render(
      <TabsContent activeTab={EntityViewTab.Properties} selectedTestSuite={minimalTestSuite} onChange={mockOnChange} />,
    );

    expect(screen.getByText('Entity: Minimal Suite')).toBeInTheDocument();
    expect(screen.getByText('ID: minimal-1')).toBeInTheDocument();
  });

  test('renders with test suite without name', () => {
    const noNameTestSuite: TestSuite = {
      id: 'no-name-1',
    };

    render(
      <TabsContent activeTab={EntityViewTab.Properties} selectedTestSuite={noNameTestSuite} onChange={mockOnChange} />,
    );

    expect(screen.getByText('Properties Tab Content')).toBeInTheDocument();
  });
});
