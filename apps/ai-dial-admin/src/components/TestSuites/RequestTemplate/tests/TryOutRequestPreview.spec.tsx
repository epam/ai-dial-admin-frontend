import { render, screen, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import {
  SuiteType,
  TestCase,
  TestCaseSchema,
  TestSuite,
  TemplateVariable,
  TemplateVariablesByRequest,
} from '@/src/models/evaluation/test-suite';
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
    getTestCaseTemplateVariables.mockResolvedValue({ '0': variables });

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

  test('renders variables for the selected request in multi-request single-turn', async () => {
    const sharedVariable: TemplateVariable[] = [
      {
        name: 'shared',
        effectiveType: TestCaseItemType.STRING,
        defaultValue: null,
        hasDefault: false,
        sources: ['body'],
        resolvedValue: null,
      },
    ];
    getTestCaseTemplateVariables.mockResolvedValue({ '0': sharedVariable, '1': sharedVariable });

    const multiRequestCase: TestCase = {
      id: 'case-mr',
      createdAt: 0,
      data: { shared: 'value' },
    };

    const { rerender } = render(
      <TryOutRequestPreview
        testSuite={multiRequestSuite}
        testCaseId="case-mr"
        schema={schema}
        initialTestCase={multiRequestCase}
        resolvedRequest={{}}
        requestBody={{}}
        onChangeRequestBody={vi.fn()}
        selectedRequestIndex={0}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Variables:shared=value')).toBeInTheDocument();
    });

    expect(screen.queryByText(TestSuitesI18nKey.TurnLabel)).not.toBeInTheDocument();
    expect(screen.getAllByText('Variables:shared=value')).toHaveLength(1);

    rerender(
      <TryOutRequestPreview
        testSuite={multiRequestSuite}
        testCaseId="case-mr"
        schema={schema}
        initialTestCase={multiRequestCase}
        resolvedRequest={{}}
        requestBody={{}}
        onChangeRequestBody={vi.fn()}
        selectedRequestIndex={1}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Variables:shared=value')).toBeInTheDocument();
    });
  });

  test('shows Turn labels inside the active request tab for combined suites', async () => {
    getTestCaseTemplateVariables.mockResolvedValue({ '0': variables, '1': variables });

    render(
      <TryOutRequestPreview
        testSuite={combinedSuite}
        testCaseId="case-1"
        schema={schema}
        initialTestCase={multiTurnCase}
        resolvedRequest={{}}
        requestBody={{}}
        onChangeRequestBody={vi.fn()}
        selectedRequestIndex={0}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByText(TestSuitesI18nKey.TurnLabel)).toHaveLength(2);
    });

    expect(screen.getByText('Variables:prompt=turn-a')).toBeInTheDocument();
    expect(screen.getByText('Variables:prompt=turn-b')).toBeInTheDocument();
  });

  test('falls back to a same-named test-case field on a later tab that binds nothing', async () => {
    getTestCaseTemplateVariables.mockResolvedValue({
      '0': [{ ...variables[0], resolvedValue: null }],
      '1': [{ ...variables[0], resolvedValue: null }],
    });

    render(
      <TryOutRequestPreview
        testSuite={{ ...combinedSuite, additionalRequests: [{}] }}
        testCaseId="case-st"
        schema={schema}
        initialTestCase={{ id: 'case-st', createdAt: 0, data: { prompt: 'once' } }}
        resolvedRequest={{}}
        requestBody={{}}
        onChangeRequestBody={vi.fn()}
        selectedRequestIndex={1}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Variables:prompt=once')).toBeInTheDocument();
    });
  });

  test('fills per-turn attribute bindings from single-turn data without multiTurnData', async () => {
    getTestCaseTemplateVariables.mockResolvedValue({
      '0': [{ ...variables[0], resolvedValue: null }],
      '1': [{ ...variables[0], resolvedValue: null }],
    });

    const singleTurnMultiRequestCase: TestCase = {
      id: 'case-st',
      createdAt: 0,
      data: { prompt: 'once', shared: 'value' },
    };

    render(
      <TryOutRequestPreview
        testSuite={combinedSuite}
        testCaseId="case-st"
        schema={schema}
        initialTestCase={singleTurnMultiRequestCase}
        resolvedRequest={{}}
        requestBody={{}}
        onChangeRequestBody={vi.fn()}
        selectedRequestIndex={0}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Variables:prompt=once')).toBeInTheDocument();
    });
  });

  test('keeps a single Variables section for single-turn cases', async () => {
    getTestCaseTemplateVariables.mockResolvedValue({ '0': [{ ...variables[0], resolvedValue: 'once' }] });

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

describe('TryOutRequestPreview per-request variables', () => {
  const greeting: TemplateVariable = {
    name: 'greeting',
    effectiveType: TestCaseItemType.STRING,
    defaultValue: null,
    hasDefault: false,
    sources: ['body'],
  };

  const chainSuite: TestSuite = {
    id: 'suite-chain',
    datasetId: 'dataset-1',
    suiteType: SuiteType.Deployment,
    endpointRef: { method: 'POST', relativeUrlPattern: '/chat' } as TestSuite['endpointRef'],
    inputBindings: [{ templateVariable: 'greeting', constantValue: 'zero' }],
    additionalRequests: [{ inputBindings: [{ templateVariable: 'greeting', dataField: 'greetingField' }] }],
  };

  const chainCase: TestCase = { id: 'case-chain', createdAt: 0, data: { greetingField: 'one' } };

  const renderChain = (suite: TestSuite, selectedRequestIndex: number) =>
    render(
      <TryOutRequestPreview
        testSuite={suite}
        testCaseId="case-chain"
        schema={schema}
        initialTestCase={chainCase}
        resolvedRequest={{}}
        requestBody={{}}
        onChangeRequestBody={vi.fn()}
        selectedRequestIndex={selectedRequestIndex}
      />,
    );

  test('resolves the same variable name differently for each request that binds it', async () => {
    const byRequest: TemplateVariablesByRequest = { '0': [greeting], '1': [greeting] };
    getTestCaseTemplateVariables.mockResolvedValue(byRequest);

    const { unmount } = renderChain(chainSuite, 0);

    await waitFor(() => {
      expect(screen.getByText('Variables:greeting=zero')).toBeInTheDocument();
    });
    unmount();

    getTestCaseTemplateVariables.mockResolvedValue(byRequest);
    renderChain(chainSuite, 1);

    await waitFor(() => {
      expect(screen.getByText('Variables:greeting=one')).toBeInTheDocument();
    });
  });

  test('does not inherit an earlier request constant binding', async () => {
    getTestCaseTemplateVariables.mockResolvedValue({ '0': [greeting], '1': [greeting] });

    renderChain({ ...chainSuite, additionalRequests: [{}] }, 1);

    await waitFor(() => {
      expect(screen.getByText('Variables:greeting=null')).toBeInTheDocument();
    });

    expect(screen.queryByText('Variables:greeting=zero')).not.toBeInTheDocument();
  });

  test('states that a request declaring no variables has none', async () => {
    getTestCaseTemplateVariables.mockResolvedValue({ '0': [], '1': [greeting] });

    renderChain(chainSuite, 0);

    await waitFor(() => {
      expect(screen.getByText(TestSuitesI18nKey.RequestNoTemplateVariables)).toBeInTheDocument();
    });
  });

  test('treats a request the response does not mention as declaring no variables', async () => {
    getTestCaseTemplateVariables.mockResolvedValue({ '0': [greeting] });

    renderChain(chainSuite, 1);

    await waitFor(() => {
      expect(screen.getByText(TestSuitesI18nKey.RequestNoTemplateVariables)).toBeInTheDocument();
    });
  });

  test('seeds the suite-level body with an entry per chain request', async () => {
    getTestSuiteTemplateVariables.mockResolvedValue({ '0': [greeting], '1': [greeting] });
    const onChangeRequestBody = vi.fn();

    render(
      <TryOutRequestPreview
        testSuite={chainSuite}
        schema={schema}
        resolvedRequest={{}}
        requestBody={{}}
        onChangeRequestBody={onChangeRequestBody}
      />,
    );

    await waitFor(() => {
      expect(onChangeRequestBody).toHaveBeenCalledWith({ '0': { greeting: '' }, '1': { greeting: '' } });
    });
  });
});
