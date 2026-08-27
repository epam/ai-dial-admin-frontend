import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { SuiteType, TestCaseSchema, TestSuite, TryOutHistoryEntry } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import TryOutResponsePreview from '../components/TryOutResponse';

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: ({ entity }: { entity: unknown }) => <div>JsonEditor:{JSON.stringify(entity)}</div>,
}));

vi.mock('../components/CollapsibleSection', () => ({
  default: ({ title, children }: { title: string; children: ReactNode }) => (
    <div>
      <span data-testid="collapsible-title">{title}</span>
      {children}
    </div>
  ),
}));

vi.mock('@/src/components/Common/CopyButton/CopyButton', () => ({
  default: () => <button type="button">Copy</button>,
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    NotificationVariant: { Success: 'success', Error: 'error' },
    DialNotification: ({ message }: { message: string }) => <div>{message}</div>,
    DialLoader: () => <div>Loading...</div>,
    DialNeutralButton: ({ label }: { label: string }) => <button type="button">{label}</button>,
    ElementSize: { Small: 'small' },
  };
});

vi.mock('@/public/images/icons/grafana.svg', () => ({
  default: () => <svg />,
}));

const responseBody = <div>TopLevelResponseBody</div>;

const schema: TestCaseSchema[] = [
  { name: 'prompt', type: TestCaseItemType.STRING, required: false, description: '', perTurn: true },
  { name: 'shared', type: TestCaseItemType.STRING, required: false, description: '', perTurn: false },
];

const multiTurnSuite: TestSuite = {
  suiteType: SuiteType.Deployment,
  inputBindings: [{ templateVariable: 'prompt', dataField: 'prompt' }],
};

const multiRequestSuite: TestSuite = {
  suiteType: SuiteType.Deployment,
  inputBindings: [{ templateVariable: 'shared', dataField: 'shared' }],
  additionalRequests: [{ inputBindings: [{ templateVariable: 'shared', dataField: 'shared' }] }],
};

const combinedSuite: TestSuite = {
  suiteType: SuiteType.Deployment,
  inputBindings: [{ templateVariable: 'prompt', dataField: 'prompt' }],
  additionalRequests: [{ inputBindings: [{ templateVariable: 'prompt', dataField: 'prompt' }] }],
};

const mixedSuite: TestSuite = {
  suiteType: SuiteType.Deployment,
  inputBindings: [{ templateVariable: 'shared', dataField: 'shared' }],
  additionalRequests: [{ inputBindings: [{ templateVariable: 'prompt', dataField: 'prompt' }] }],
};

const entry = (body: unknown, out: unknown): TryOutHistoryEntry => ({
  resolvedRequest: { body },
  response: { statusCode: 200, body: out },
});

describe('TryOutResponsePreview history', () => {
  test('renders Turn labels for multi-turn only', () => {
    const history = [entry({ turn: 1 }, { out: 'a' }), entry({ turn: 2 }, { out: 'b' })];

    render(
      <TryOutResponsePreview
        response={{ statusCode: 200 }}
        resolvedRequest={{ body: { top: true } }}
        history={history}
        responseBody={responseBody}
        testSuite={multiTurnSuite}
        schema={schema}
        multiTurnData={[{ prompt: 'a' }, { prompt: 'b' }]}
      />,
    );

    expect(screen.getAllByText(TestSuitesI18nKey.TurnLabel)).toHaveLength(2);
    expect(screen.queryByText(TestSuitesI18nKey.RequestLabel)).not.toBeInTheDocument();
    expect(screen.queryByText('TopLevelResponseBody')).not.toBeInTheDocument();
  });

  test('renders Request content for the selected request index', () => {
    const history = [entry({ req: 1 }, { out: 'a' }), entry({ req: 2 }, { out: 'b' })];

    const { rerender } = render(
      <TryOutResponsePreview
        response={{ statusCode: 200 }}
        resolvedRequest={{ body: {} }}
        history={history}
        responseBody={responseBody}
        testSuite={multiRequestSuite}
        schema={schema}
        multiTurnData={[{ shared: 'x' }]}
        selectedRequestIndex={0}
      />,
    );

    expect(screen.getByText('JsonEditor:{"req":1}')).toBeInTheDocument();
    expect(screen.getByText('JsonEditor:{"out":"a"}')).toBeInTheDocument();
    expect(screen.queryByText('JsonEditor:{"req":2}')).not.toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.TurnLabel)).not.toBeInTheDocument();

    rerender(
      <TryOutResponsePreview
        response={{ statusCode: 200 }}
        resolvedRequest={{ body: {} }}
        history={history}
        responseBody={responseBody}
        testSuite={multiRequestSuite}
        schema={schema}
        multiTurnData={[{ shared: 'x' }]}
        selectedRequestIndex={1}
      />,
    );

    expect(screen.getByText('JsonEditor:{"req":2}')).toBeInTheDocument();
    expect(screen.getByText('JsonEditor:{"out":"b"}')).toBeInTheDocument();
    expect(screen.queryByText('JsonEditor:{"req":1}')).not.toBeInTheDocument();
  });

  test('shows Turn labels inside the active request tab for combined suites', () => {
    const history = [
      entry({ r: 0, t: 0 }, { out: 'a' }),
      entry({ r: 0, t: 1 }, { out: 'b' }),
      entry({ r: 1, t: 0 }, { out: 'c' }),
      entry({ r: 1, t: 1 }, { out: 'd' }),
    ];

    render(
      <TryOutResponsePreview
        response={{ statusCode: 200 }}
        resolvedRequest={{ body: {} }}
        history={history}
        responseBody={responseBody}
        testSuite={combinedSuite}
        schema={schema}
        multiTurnData={[{ prompt: 'a' }, { prompt: 'b' }]}
        selectedRequestIndex={0}
      />,
    );

    expect(screen.getAllByText(TestSuitesI18nKey.TurnLabel)).toHaveLength(2);
    expect(screen.getByText('JsonEditor:{"out":"a"}')).toBeInTheDocument();
    expect(screen.getByText('JsonEditor:{"out":"b"}')).toBeInTheDocument();
    expect(screen.queryByText('JsonEditor:{"out":"c"}')).not.toBeInTheDocument();
  });

  test('mixed chain: Request 1 has no Turn labels, Request 2 has Turns', () => {
    const history = [
      entry({ r: 0 }, { out: 'setup' }),
      entry({ r: 1, t: 0 }, { out: 'a' }),
      entry({ r: 1, t: 1 }, { out: 'b' }),
      entry({ r: 1, t: 2 }, { out: 'c' }),
    ];

    render(
      <TryOutResponsePreview
        response={{ statusCode: 200 }}
        resolvedRequest={{ body: {} }}
        history={history}
        responseBody={responseBody}
        testSuite={mixedSuite}
        schema={schema}
        multiTurnData={[{ prompt: 'a' }, { prompt: 'b' }, { prompt: 'c' }]}
        selectedRequestIndex={1}
      />,
    );

    expect(screen.getAllByText(TestSuitesI18nKey.TurnLabel)).toHaveLength(3);
    expect(screen.queryByText('JsonEditor:{"out":"setup"}')).not.toBeInTheDocument();
  });

  test('keeps the single request/response pair when history is absent', () => {
    render(
      <TryOutResponsePreview
        response={{ statusCode: 200 }}
        resolvedRequest={{ body: { top: true } }}
        responseBody={responseBody}
        testSuite={multiTurnSuite}
        schema={schema}
      />,
    );

    expect(screen.getByText(BasicI18nKey.Request)).toBeInTheDocument();
    expect(screen.getByText('JsonEditor:{"top":true}')).toBeInTheDocument();
    expect(screen.getByText('TopLevelResponseBody')).toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.TurnLabel)).not.toBeInTheDocument();
  });

  test('single-entry history uses top-level pair without Turn label', () => {
    render(
      <TryOutResponsePreview
        response={{ statusCode: 200 }}
        resolvedRequest={{ body: { top: true } }}
        history={[entry({ turn: 1 }, { out: 'a' })]}
        responseBody={responseBody}
        testSuite={multiTurnSuite}
        schema={schema}
        multiTurnData={[{ prompt: 'once' }]}
      />,
    );

    expect(screen.queryByText(TestSuitesI18nKey.TurnLabel)).not.toBeInTheDocument();
    expect(screen.getByText('TopLevelResponseBody')).toBeInTheDocument();
    expect(screen.getByText('JsonEditor:{"top":true}')).toBeInTheDocument();
  });
});
