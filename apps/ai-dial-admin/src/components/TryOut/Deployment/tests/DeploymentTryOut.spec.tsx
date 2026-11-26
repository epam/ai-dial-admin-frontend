import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getTryOutInterfaces } from '@/src/app/actions/try-out';
import DeploymentTryOut from '@/src/components/TryOut/Deployment/DeploymentTryOut';
import {
  DeploymentTryOutResponse,
  sendDeploymentTryOut,
} from '@/src/components/TryOut/Deployment/send-try-out-request';
import { ButtonsI18nKey, DeploymentTryOutI18nKey, GrafanaLinksI18nKey } from '@/src/constants/i18n';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';

vi.mock('@/src/app/actions/try-out');
vi.mock('@/src/components/TryOut/Deployment/send-try-out-request');

vi.mock('@/src/components/TryOut/components/TryOutResponseBody', () => ({
  default: ({
    response,
    isRequestSend,
  }: {
    response: { body?: unknown; events?: unknown[] } | null;
    isRequestSend: boolean;
  }) => (
    <div>
      <span>awaiting:{String(isRequestSend)}</span>
      <span>events:{response?.events?.length ?? 0}</span>
      <span>body:{JSON.stringify(response?.body)}</span>
    </div>
  ),
}));

vi.mock('@/src/components/TryOut/Deployment/components/AdvancedRequest', () => ({
  default: ({
    bodyText,
    isBodyValid,
    onChangeBody,
    onReset,
  }: {
    bodyText: string;
    isBodyValid: boolean;
    onChangeBody: (text: string) => void;
    onReset: () => void;
  }) => (
    <div>
      <pre>{bodyText}</pre>
      <span>valid:{String(isBodyValid)}</span>
      <button type="button" onClick={() => onChangeBody('{"edited":true}')}>
        edit-body
      </button>
      <button type="button" onClick={() => onChangeBody('{oops')}>
        break-body
      </button>
      <button type="button" onClick={onReset}>
        reset-body
      </button>
    </div>
  ),
}));

const CHAT = 'chat';

const makeResult = (overrides: Partial<DeploymentTryOutResponse> & { body?: BodyInit | null } = {}) => {
  const { body = '{"id":"r1"}', status = 200, ...rest } = overrides;
  return {
    status,
    isProxyError: false,
    isEventStream: false,
    response: new Response(body, { status }),
    ...rest,
  } as DeploymentTryOutResponse;
};

const sseStream = (...chunks: string[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });

describe('DeploymentTryOut', () => {
  const renderPanel = async (reported: string[] | null = [CHAT]) => {
    vi.mocked(getTryOutInterfaces).mockResolvedValue(reported);
    const user = userEvent.setup();
    render(<DeploymentTryOut deployment="gpt-4" />);
    await screen.findByRole('textbox', { name: DeploymentTryOutI18nKey.Message });

    return user;
  };

  const typeMessage = (user: ReturnType<typeof userEvent.setup>, text: string) =>
    user.type(screen.getByRole('textbox', { name: DeploymentTryOutI18nKey.Message }), text);

  const clickSend = (user: ReturnType<typeof userEvent.setup>) =>
    user.click(screen.getByRole('button', { name: ButtonsI18nKey.SendRequest }));

  beforeEach(() => {
    vi.mocked(sendDeploymentTryOut).mockResolvedValue(makeResult());
  });

  describe('loading', () => {
    test('shows neither the form nor the unavailable message until the interfaces are known', async () => {
      let resolveInterfaces: (reported: string[]) => void = () => void 0;
      vi.mocked(getTryOutInterfaces).mockReturnValue(
        new Promise((resolve) => {
          resolveInterfaces = resolve;
        }),
      );
      render(<DeploymentTryOut deployment="gpt-4" />);

      expect(screen.queryByRole('textbox', { name: DeploymentTryOutI18nKey.Message })).toBeNull();
      expect(screen.queryByText(DeploymentTryOutI18nKey.Unavailable)).toBeNull();
      expect(screen.getByRole('button', { name: ButtonsI18nKey.SendRequest })).toBeDisabled();

      resolveInterfaces([CHAT]);

      expect(await screen.findByRole('textbox', { name: DeploymentTryOutI18nKey.Message })).toBeTruthy();
    });

    test('shows the unavailable message, not the form, once a deployment turns out to serve none', async () => {
      vi.mocked(getTryOutInterfaces).mockResolvedValue(['mcp']);
      render(<DeploymentTryOut deployment="tool" />);

      expect(await screen.findByText(DeploymentTryOutI18nKey.Unavailable)).toBeTruthy();
      expect(screen.queryByRole('textbox', { name: DeploymentTryOutI18nKey.Message })).toBeNull();
    });
  });

  describe('interfaces', () => {
    test('selects the first interface the deployment serves', async () => {
      await renderPanel(['anthropicMessages', 'openaiResponses']);

      expect(
        screen.getByRole('combobox', { name: new RegExp(DeploymentTryOutI18nKey.InterfaceResponses) }),
      ).toBeTruthy();
    });

    test('says Try out is unavailable and offers no Send when none is served', async () => {
      vi.mocked(getTryOutInterfaces).mockResolvedValue(['mcp']);
      render(<DeploymentTryOut deployment="tool" />);

      expect(await screen.findByText(DeploymentTryOutI18nKey.Unavailable)).toBeTruthy();
      expect(screen.getByRole('button', { name: ButtonsI18nKey.SendRequest })).toBeDisabled();
    });

    test('offers every interface and notes it when the interfaces could not be read', async () => {
      await renderPanel(null);

      expect(screen.getByText(DeploymentTryOutI18nKey.InterfacesUnknownNote)).toBeTruthy();
      expect(
        screen.getByRole('combobox', { name: new RegExp(DeploymentTryOutI18nKey.InterfaceChatCompletions) }),
      ).toBeTruthy();
    });
  });

  describe('Simple mode', () => {
    test('disables Send while the message is empty', async () => {
      await renderPanel();

      expect(screen.getByRole('button', { name: ButtonsI18nKey.SendRequest })).toBeDisabled();
    });

    test('sends the message as a streamed chat completions request and shows the reply', async () => {
      const user = await renderPanel();

      await typeMessage(user, 'hello');
      await clickSend(user);

      expect(await screen.findByText('body:{"id":"r1"}')).toBeTruthy();
      expect(sendDeploymentTryOut).toHaveBeenCalledOnce();
      expect(vi.mocked(sendDeploymentTryOut).mock.calls[0][0]).toEqual({
        interface: DeploymentInterfaceType.OpenAIChatCompletions,
        deployment: 'gpt-4',
        headers: {},
        query: {},
        body: { messages: [{ role: 'user', content: 'hello' }], stream: true },
      });
    });

    test('announces the outcome in a live region', async () => {
      const user = await renderPanel();

      await typeMessage(user, 'hello');
      await clickSend(user);

      expect(await screen.findByText(DeploymentTryOutI18nKey.StatusDone)).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('streaming', () => {
    test('shows the events and the assembled text once the stream ends', async () => {
      vi.mocked(sendDeploymentTryOut).mockResolvedValue(
        makeResult({
          isEventStream: true,
          body: sseStream(
            'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n',
            'data: {"choices":[{"delta":{"content":"lo"}}]}\n\ndata: [DONE]\n\n',
          ),
        }),
      );
      const user = await renderPanel();

      await typeMessage(user, 'hi');
      await clickSend(user);

      expect(await screen.findByText('events:2')).toBeTruthy();
      expect(screen.getByText('body:"Hello"')).toBeTruthy();
      expect(screen.getByText(DeploymentTryOutI18nKey.StatusDone)).toBeTruthy();
    });

    test('stops an in-progress request without showing an error', async () => {
      vi.mocked(sendDeploymentTryOut).mockImplementation(
        (_request, signal) =>
          new Promise((_resolve, reject) => {
            signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
          }),
      );
      const user = await renderPanel();

      await typeMessage(user, 'hi');
      await clickSend(user);
      await user.click(await screen.findByRole('button', { name: ButtonsI18nKey.Stop }));

      expect(await screen.findByRole('button', { name: ButtonsI18nKey.SendRequest })).toBeTruthy();
      expect(screen.queryByText(DeploymentTryOutI18nKey.StatusFailed)).toBeNull();
      expect(screen.queryByText(DeploymentTryOutI18nKey.NetworkFailure)).toBeNull();
    });
  });

  describe('failures', () => {
    test.each([
      [403, false, DeploymentTryOutI18nKey.NoAccess],
      [404, false, DeploymentTryOutI18nKey.NotFound],
      [422, false, DeploymentTryOutI18nKey.Rejected],
      [500, false, DeploymentTryOutI18nKey.ServerFailure],
      [502, true, DeploymentTryOutI18nKey.NetworkFailure],
    ])('reports status %s (route answer: %s) with the matching message', async (status, isProxyError, message) => {
      vi.mocked(sendDeploymentTryOut).mockResolvedValue(
        makeResult({ status, isProxyError, body: '{"error":{"message":"x"}}' }),
      );
      const user = await renderPanel();

      await typeMessage(user, 'hi');
      await clickSend(user);

      expect(await screen.findByText(`${message} (${status})`)).toBeTruthy();
      expect(screen.getByText(DeploymentTryOutI18nKey.StatusFailed)).toBeTruthy();
      expect(screen.getByText(/body:.*"error"/)).toBeTruthy();
    });

    test('reports a generic failure when the request cannot be sent', async () => {
      vi.mocked(sendDeploymentTryOut).mockRejectedValue(new TypeError('Failed to fetch'));
      const user = await renderPanel();

      await typeMessage(user, 'hi');
      await clickSend(user);

      expect(await screen.findByText(DeploymentTryOutI18nKey.NetworkFailure)).toBeTruthy();
    });
  });

  describe('trace link', () => {
    test('is shown when the route returned a trace url', async () => {
      vi.mocked(sendDeploymentTryOut).mockResolvedValue(makeResult({ traceUrl: 'https://grafana.test/x' }));
      const user = await renderPanel();

      await typeMessage(user, 'hi');
      await clickSend(user);

      expect(
        await screen.findByRole('button', {
          name: new RegExp(`${GrafanaLinksI18nKey.OpenTrace}.*${GrafanaLinksI18nKey.OpensInNewTab}`),
        }),
      ).toBeTruthy();
    });

    test('is absent when the route returned none', async () => {
      const user = await renderPanel();

      await typeMessage(user, 'hi');
      await clickSend(user);
      await screen.findByText(DeploymentTryOutI18nKey.StatusDone);

      expect(screen.queryByRole('button', { name: new RegExp(GrafanaLinksI18nKey.OpenTrace) })).toBeNull();
    });
  });

  describe('Advanced mode', () => {
    const openAdvanced = (user: ReturnType<typeof userEvent.setup>) =>
      user.click(screen.getByRole('tab', { name: DeploymentTryOutI18nKey.ModeAdvanced }));
    const openSimple = (user: ReturnType<typeof userEvent.setup>) =>
      user.click(screen.getByRole('tab', { name: DeploymentTryOutI18nKey.ModeSimple }));

    test('shows the body Simple mode built', async () => {
      const user = await renderPanel();

      await typeMessage(user, 'hello');
      await openAdvanced(user);

      expect(screen.getByText(/"content": "hello"/)).toBeTruthy();
    });

    test('keeps an edited body across mode switches and sends it', async () => {
      const user = await renderPanel();

      await typeMessage(user, 'hello');
      await openAdvanced(user);
      await user.click(screen.getByRole('button', { name: 'edit-body' }));
      await openSimple(user);
      await openAdvanced(user);
      await clickSend(user);

      expect(screen.getByText('{"edited":true}')).toBeTruthy();
      expect(vi.mocked(sendDeploymentTryOut).mock.calls[0][0].body).toEqual({ edited: true });
    });

    test('rebuilds the body when the message changes', async () => {
      const user = await renderPanel();

      await typeMessage(user, 'a');
      await openAdvanced(user);
      await user.click(screen.getByRole('button', { name: 'edit-body' }));
      await openSimple(user);
      await typeMessage(user, 'b');
      await openAdvanced(user);

      expect(screen.getByText(/"content": "ab"/)).toBeTruthy();
    });

    test('rebuilds the body on Reset', async () => {
      const user = await renderPanel();

      await typeMessage(user, 'hello');
      await openAdvanced(user);
      await user.click(screen.getByRole('button', { name: 'edit-body' }));
      await user.click(screen.getByRole('button', { name: 'reset-body' }));

      expect(screen.getByText(/"content": "hello"/)).toBeTruthy();
    });

    test('disables Send while the body is not valid JSON', async () => {
      const user = await renderPanel();

      await typeMessage(user, 'hello');
      await openAdvanced(user);
      await user.click(screen.getByRole('button', { name: 'break-body' }));

      expect(screen.getByText('valid:false')).toBeTruthy();
      expect(screen.getByRole('button', { name: ButtonsI18nKey.SendRequest })).toBeDisabled();
    });
  });
});
