import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { DeploymentApiInterface } from '@/src/models/dial/interfaces';
import { Deployment } from '@/src/models/evaluation/deployment';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import EditRequestWizard from '../EditRequestWizard';

vi.mock('@/src/components/TestSuites/Methods/Methods', () => ({
  default: ({ testSuite, onChange, children }: any) => (
    <div>
      <span>Methods:{testSuite.endpointRef?.relativeUrlPattern ?? 'none'}</span>
      <button
        type="button"
        onClick={() => onChange({ ...testSuite, endpointRef: { method: 'GET', relativeUrlPattern: '/v1/picked' } })}
      >
        pick-method
      </button>
      {children}
    </div>
  ),
}));

vi.mock('@/src/components/TestSuites/RequestTemplate/RequestTemplate', () => ({
  default: ({ testSuite, onChangeTestSuite, resetSignal }: any) => (
    <div>
      <span>RequestTemplate:{testSuite.requestTemplate?.urlTemplate ?? 'none'}</span>
      <span>Body:{JSON.stringify(testSuite.requestTemplate?.body?.content ?? null)}</span>
      <span>ResetSignal:{resetSignal}</span>
      <button
        type="button"
        onClick={() => onChangeTestSuite({ ...testSuite, requestTemplate: { urlTemplate: 'edited' } })}
      >
        edit-body
      </button>
    </div>
  ),
}));

const baseSuite: TestSuite = {
  id: 'suite-1',
  endpointRef: { method: 'POST', relativeUrlPattern: '/v1/main' },
  requestTemplate: { urlTemplate: '/v1/main', body: { contentType: 'application/json', content: {} } },
};

const renderWizard = (props?: Partial<React.ComponentProps<typeof EditRequestWizard>>) =>
  render(
    <EditRequestWizard
      testSuite={baseSuite}
      onChangeTestSuite={vi.fn()}
      selectedApplication={null}
      isOpen
      onClose={vi.fn()}
      {...props}
    />,
  );

describe('EditRequestWizard', () => {
  test('opens on the Methods step and shows the current method', () => {
    renderWizard();

    expect(screen.getByText('Methods:/v1/main')).toBeInTheDocument();
    expect(screen.queryByText(/RequestTemplate:/)).not.toBeInTheDocument();
  });

  test('disables Next when the request has no method/path configured', () => {
    renderWizard({ testSuite: { id: 'suite-1' } });

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Next })).toBeDisabled();
  });

  test('enables Next once a valid method/path is selected and moves to Configuration', async () => {
    const user = userEvent.setup();
    renderWizard();

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Next })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Next }));

    expect(screen.getByText('RequestTemplate:/v1/main')).toBeInTheDocument();
  });

  test('Back returns to Methods, preserving the selection made there', async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.click(screen.getByRole('button', { name: 'pick-method' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Next }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Back }));

    expect(screen.getByText('Methods:/v1/picked')).toBeInTheDocument();
  });

  test('Cancel closes the wizard without applying any change', async () => {
    const user = userEvent.setup();
    const onChangeTestSuite = vi.fn();
    const onClose = vi.fn();
    renderWizard({ onChangeTestSuite, onClose });

    await user.click(screen.getByRole('button', { name: 'pick-method' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

    expect(onChangeTestSuite).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });

  test('Save commits the method and request template changes together, then closes', async () => {
    const user = userEvent.setup();
    const onChangeTestSuite = vi.fn();
    const onClose = vi.fn();
    renderWizard({ onChangeTestSuite, onClose });

    await user.click(screen.getByRole('button', { name: 'pick-method' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Next }));
    await user.click(screen.getByRole('button', { name: 'edit-body' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(onChangeTestSuite).toHaveBeenCalledWith(
      expect.objectContaining({
        endpointRef: { method: 'GET', relativeUrlPattern: '/v1/picked' },
        requestTemplate: { urlTemplate: 'edited' },
      }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  test('reopening resets to the Methods step with the original request, discarding prior edits', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <EditRequestWizard
        testSuite={baseSuite}
        onChangeTestSuite={vi.fn()}
        selectedApplication={null}
        isOpen={false}
        onClose={vi.fn()}
      />,
    );

    rerender(
      <EditRequestWizard
        testSuite={baseSuite}
        onChangeTestSuite={vi.fn()}
        selectedApplication={null}
        isOpen
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'pick-method' }));
    expect(screen.getByText('Methods:/v1/picked')).toBeInTheDocument();

    rerender(
      <EditRequestWizard
        testSuite={baseSuite}
        onChangeTestSuite={vi.fn()}
        selectedApplication={null}
        isOpen={false}
        onClose={vi.fn()}
      />,
    );
    rerender(
      <EditRequestWizard
        testSuite={baseSuite}
        onChangeTestSuite={vi.fn()}
        selectedApplication={null}
        isOpen
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Methods:/v1/main')).toBeInTheDocument();
  });

  test('stays on Configuration when the testSuite prop gets a new reference while open', async () => {
    const user = userEvent.setup();
    const onChangeTestSuite = vi.fn();
    const { rerender } = render(
      <EditRequestWizard
        testSuite={baseSuite}
        onChangeTestSuite={onChangeTestSuite}
        selectedApplication={null}
        isOpen
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Next }));
    await user.click(screen.getByRole('button', { name: 'edit-body' }));
    expect(screen.getByText('RequestTemplate:edited')).toBeInTheDocument();

    // A parent re-render that recomputes a new `testSuite` object with equivalent content — e.g. an
    // unmemoized derived view — must not be mistaken for the wizard being (re)opened.
    rerender(
      <EditRequestWizard
        testSuite={{ ...baseSuite }}
        onChangeTestSuite={onChangeTestSuite}
        selectedApplication={null}
        isOpen
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('RequestTemplate:edited')).toBeInTheDocument();
    expect(screen.queryByText(/Methods:/)).not.toBeInTheDocument();
  });

  test('shows Reset to default only once the body has been edited, and reset reverts it', async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Next }));

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.ResetToDefault })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'edit-body' }));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.ResetToDefault })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.ResetToDefault }));

    expect(screen.getByText('RequestTemplate:/v1/main')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.ResetToDefault })).not.toBeInTheDocument();
  });

  test('Reset to default bumps the reset signal so the body editor refreshes even though the endpoint is unchanged', async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Next }));
    expect(screen.getByText('ResetSignal:0')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'edit-body' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.ResetToDefault }));

    expect(screen.getByText('ResetSignal:1')).toBeInTheDocument();
  });

  test('Reset to default restores a Responses API method to its own seeded body, not an empty one', async () => {
    const user = userEvent.setup();
    const suite: TestSuite = {
      id: 'suite-1',
      endpointRef: { method: 'POST', relativeUrlPattern: '/openai/v1/responses' },
      requestTemplate: {
        urlTemplate: '/openai/v1/responses',
        body: { contentType: 'application/json', content: { model: 'glm-5.2', input: '${{user_message}}' } },
      },
    };
    const selectedApplication = {
      $type: 'dial-model',
      deploymentId: 'glm-5.2',
      interfaces: [DeploymentApiInterface.OpenAIResponses],
    } as Deployment;

    renderWizard({ testSuite: suite, selectedApplication });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Next }));

    // An unmodified, already-correct template should not offer Reset — this is the "always visible"
    // regression: comparing against a generic empty default made every non-chat-completion method
    // look edited from the moment the wizard opened.
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.ResetToDefault })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'edit-body' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.ResetToDefault }));

    expect(
      screen.getByText(`Body:${JSON.stringify({ model: 'glm-5.2', input: '${{user_message}}' })}`),
    ).toBeInTheDocument();
  });

  test('shows Configuration as incomplete for a new request until the user visits it', async () => {
    const user = userEvent.setup();
    renderWizard({ isNewRequest: true });

    expect(screen.getByRole('button', { name: `2${TestSuitesI18nKey.Configuration}` })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Next }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Back }));

    expect(screen.getByRole('button', { name: TestSuitesI18nKey.Configuration })).toBeInTheDocument();
  });

  test('treats Configuration as already complete when editing an existing request', () => {
    renderWizard({ isNewRequest: false });

    expect(screen.getByRole('button', { name: TestSuitesI18nKey.Configuration })).toBeInTheDocument();
  });

  test('Save stays enabled on Configuration for a new request even before it has been visited via Next', async () => {
    const user = userEvent.setup();
    renderWizard({ isNewRequest: true });

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Next }));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeEnabled();
  });
});
