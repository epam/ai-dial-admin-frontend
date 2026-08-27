import { render, screen, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { SuiteType, TestCase, TestCaseSchema, TestSuite, TemplateVariable } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import TryOutRequestPreview from '../components/TryOutRequestPreview';

const getTestCaseTemplateVariables = vi.fn();
const getTestSuiteTemplateVariables = vi.fn();
const getDatasetTestCase = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getTestCaseTemplateVariables: (...args: unknown[]) => getTestCaseTemplateVariables(...args),
  getTestSuiteTemplateVariables: (...args: unknown[]) => getTestSuiteTemplateVariables(...args),
}));

vi.mock('@/src/app/[lang]/datasets/actions', () => ({
  getDatasetTestCase: (...args: unknown[]) => getDatasetTestCase(...args),
}));

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: () => <div>JsonEditor</div>,
}));

vi.mock('../components/CollapsibleSection', () => ({
  default: ({ title, children }: { title: string; children: ReactNode }) => (
    <div>
      <span data-testid="collapsible-title">{title}</span>
      {children}
    </div>
  ),
}));

vi.mock('../components/Variables', () => ({
  default: ({ variables }: { variables: TemplateVariable[] }) => (
    <div>Variables:{variables.map((v) => `${v.name}=${String(v.resolvedValue)}`).join(',')}</div>
  ),
}));

const schema: TestCaseSchema[] = [
  { name: 'prompt', type: TestCaseItemType.STRING, required: false, description: '', perTurn: true },
  { name: 'shared', type: TestCaseItemType.STRING, required: false, description: '', perTurn: false },
];

const variables: TemplateVariable[] = [
  {
    name: 'prompt',
    effectiveType: TestCaseItemType.STRING,
    defaultValue: null,
    hasDefault: false,
    sources: ['body'],
    resolvedValue: 'shared-only',
  },
];

const multiTurnSuite: TestSuite = {
  id: 'suite-1',
  datasetId: 'dataset-1',
  suiteType: SuiteType.Deployment,
  inputBindings: [{ templateVariable: 'prompt', dataField: 'prompt' }],
  endpointRef: { method: 'POST', relativeUrlPattern: '/chat' } as TestSuite['endpointRef'],
};

const multiRequestSuite: TestSuite = {
  ...multiTurnSuite,
  inputBindings: [{ templateVariable: 'shared', dataField: 'shared' }],
  additionalRequests: [{ inputBindings: [{ templateVariable: 'shared', dataField: 'shared' }] }],
};

const combinedSuite: TestSuite = {
  ...multiTurnSuite,
  additionalRequests: [{ inputBindings: [{ templateVariable: 'prompt', dataField: 'prompt' }] }],
};

const multiTurnCase: TestCase = {
  id: 'case-1',
  createdAt: 0,
  data: {},
  multiTurnData: [{ prompt: 'turn-a' }, { prompt: 'turn-b' }],
};

const singleTurnCase: TestCase = {
  id: 'case-2',
  createdAt: 0,
  data: { prompt: 'once' },
};

describe('TryOutRequestPreview section labels', () => {
  test('renders one Variables section per turn when multi-turn only', async () => {
    getTestCaseTemplateVariables.mockResolvedValue(variables);

    render(
      <TryOutRequestPreview
        testSuite={multiTurnSuite}
        testCaseId="case-1"
        schema={schema}
        initialTestCase={multiTurnCase}
        resolvedRequest={{}}
        requestBody={{}}
        onChangeRequestBody={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByText(TestSuitesI18nKey.TurnLabel)).toHaveLength(2);
    });

    expect(screen.getByText('Variables:prompt=turn-a')).toBeInTheDocument();
    expect(screen.getByText('Variables:prompt=turn-b')).toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.RequestLabel)).not.toBeInTheDocument();
    expect(getDatasetTestCase).not.toHaveBeenCalled();
  });

  test('renders Request labels for multi-request single-turn', async () => {
    getTestCaseTemplateVariables.mockResolvedValue([
      {
        name: 'shared',
        effectiveType: TestCaseItemType.STRING,
        defaultValue: null,
        hasDefault: false,
        sources: ['body'],
        resolvedValue: null,
      },
    ]);

    const multiRequestCase: TestCase = {
      id: 'case-mr',
      createdAt: 0,
      data: { shared: 'value' },
    };

    render(
      <TryOutRequestPreview
        testSuite={multiRequestSuite}
        testCaseId="case-mr"
        schema={schema}
        initialTestCase={multiRequestCase}
        resolvedRequest={{}}
        requestBody={{}}
        onChangeRequestBody={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByText(TestSuitesI18nKey.RequestLabel)).toHaveLength(2);
    });

    expect(screen.queryByText(TestSuitesI18nKey.TurnLabel)).not.toBeInTheDocument();
  });

  test('nests Turns under Request headers for combined suites', async () => {
    getTestCaseTemplateVariables.mockResolvedValue(variables);

    render(
      <TryOutRequestPreview
        testSuite={combinedSuite}
        testCaseId="case-1"
        schema={schema}
        initialTestCase={multiTurnCase}
        resolvedRequest={{}}
        requestBody={{}}
        onChangeRequestBody={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('collapsible-title')).toHaveLength(2);
    });

    expect(screen.getAllByText(TestSuitesI18nKey.TurnLabel)).toHaveLength(4);
  });

  test('keeps a single Variables section for single-turn cases', async () => {
    getTestCaseTemplateVariables.mockResolvedValue([{ ...variables[0], resolvedValue: 'once' }]);

    render(
      <TryOutRequestPreview
        testSuite={multiTurnSuite}
        testCaseId="case-2"
        schema={schema}
        initialTestCase={singleTurnCase}
        resolvedRequest={{}}
        requestBody={{}}
        onChangeRequestBody={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Variables:prompt=once')).toBeInTheDocument();
    });

    expect(screen.queryByText(TestSuitesI18nKey.TurnLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.RequestLabel)).not.toBeInTheDocument();
  });
});
