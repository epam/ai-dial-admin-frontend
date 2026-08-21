import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { TryOutHistoryEntry } from '@/src/models/evaluation/test-suite';
import TryOutResponsePreview from '../components/TryOutResponse';

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: ({ entity }: { entity: unknown }) => <div>JsonEditor:{JSON.stringify(entity)}</div>,
}));

vi.mock('../components/CollapsibleSection', () => ({
  default: ({ title, children }: { title: string; children: ReactNode }) => (
    <div>
      <span>{title}</span>
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

describe('TryOutResponsePreview history', () => {
  test('renders per-turn sections when history is present and omits the top-level response body', () => {
    const history: TryOutHistoryEntry[] = [
      {
        resolvedRequest: { body: { turn: 1 } },
        response: { statusCode: 200, body: { out: 'a' } },
      },
      {
        resolvedRequest: { body: { turn: 2 } },
        response: { statusCode: 200, body: { out: 'b' } },
      },
    ];

    render(
      <TryOutResponsePreview
        response={{ statusCode: 200 }}
        resolvedRequest={{ body: { top: true } }}
        history={history}
        responseBody={responseBody}
      />,
    );

    expect(screen.getAllByText(TestSuitesI18nKey.TurnLabel)).toHaveLength(2);
    expect(screen.getByText('JsonEditor:{"turn":1}')).toBeInTheDocument();
    expect(screen.getByText('JsonEditor:{"turn":2}')).toBeInTheDocument();
    expect(screen.getByText('JsonEditor:{"out":"a"}')).toBeInTheDocument();
    expect(screen.getByText('JsonEditor:{"out":"b"}')).toBeInTheDocument();
    expect(screen.queryByText('TopLevelResponseBody')).not.toBeInTheDocument();
    expect(screen.queryByText('JsonEditor:{"top":true}')).not.toBeInTheDocument();
  });

  test('keeps the single request/response pair when history is absent', () => {
    render(
      <TryOutResponsePreview
        response={{ statusCode: 200 }}
        resolvedRequest={{ body: { top: true } }}
        responseBody={responseBody}
      />,
    );

    expect(screen.getByText(BasicI18nKey.Request)).toBeInTheDocument();
    expect(screen.getByText('JsonEditor:{"top":true}')).toBeInTheDocument();
    expect(screen.getByText('TopLevelResponseBody')).toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.TurnLabel)).not.toBeInTheDocument();
  });
});
