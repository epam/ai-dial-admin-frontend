import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import TryOutResponseBody from '@/src/components/TryOut/components/TryOutResponseBody';
import { BasicI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: ({ entity, text }: { entity: unknown; text?: string }) => (
    <div>JsonEditor:{text ?? JSON.stringify(entity)}</div>
  ),
}));

vi.mock('@/src/components/Common/CopyButton/CopyButton', () => ({
  default: ({ value }: { value: string }) => <button type="button">Copy:{value}</button>,
}));

vi.mock('@/src/components/TryOut/components/TryOutEventsSection', () => ({
  default: ({ streaming, isLoading }: { streaming?: boolean; isLoading?: boolean }) => (
    <div>
      Events:{String(streaming)}:{String(isLoading)}
    </div>
  ),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, Spinner: () => <div>Loading...</div> };
});

describe('TryOutResponseBody', () => {
  test('shows the response body and a copy button with its text', () => {
    render(<TryOutResponseBody response={{ body: { a: 1 } }} isRequestSend={false} growOnOpen={false} />);

    expect(screen.getByText(BasicI18nKey.Response)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy:/ })).toHaveTextContent('"a": 1');
  });

  test('shows a spinner instead of the body while the request is in progress', () => {
    render(<TryOutResponseBody response={{ body: { a: 1 } }} isRequestSend growOnOpen={false} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText(/JsonEditor:/)).not.toBeInTheDocument();
  });

  test('passes streaming state to the events section', () => {
    render(<TryOutResponseBody response={{ streaming: true, events: [] }} isRequestSend={false} growOnOpen />);

    expect(screen.getByText('Events:true:false')).toBeInTheDocument();
  });

  test('lets the events section load independently of the response body', () => {
    render(
      <TryOutResponseBody
        response={{ streaming: true, events: [{ a: 1 }] }}
        isRequestSend
        isEventsLoading={false}
        growOnOpen={false}
      />,
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Events:true:false')).toBeInTheDocument();
  });

  test('renders with no response', () => {
    render(<TryOutResponseBody response={null} isRequestSend={false} growOnOpen={false} />);

    expect(screen.getByText(BasicI18nKey.Response)).toBeInTheDocument();
  });
});
