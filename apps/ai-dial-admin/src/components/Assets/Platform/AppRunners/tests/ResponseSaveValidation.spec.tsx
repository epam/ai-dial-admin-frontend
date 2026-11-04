import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import AppRunnerAssetView from '@/src/components/Assets/Platform/AppRunners/View';
import { ButtonsI18nKey, EntityFieldsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import {
  SaveValidationContextProvider,
  useSaveValidationContext,
  ValidationActionType,
} from '@/src/context/SaveValidationContext';
import { DialAppRunnerResource } from '@/src/models/dial/resource';

vi.unmock('@/src/context/SaveValidationContext');

const runner = {
  $id: '',
  name: 'runner',
  path: 'runner',
  folderId: '',
  'dial:applicationTypeDisplayName': 'Runner',
  'dial:applicationTypeRoutes': {
    health: { 'dial:paths': ['/health'], 'dial:methods': ['GET'], 'dial:upstreams': [] },
    other: { 'dial:paths': ['/other'], 'dial:methods': ['GET'], 'dial:upstreams': [] },
  },
} as DialAppRunnerResource;

const ValidationProbe = () => {
  const { errorFields, dispatch } = useSaveValidationContext();
  return (
    <>
      <output aria-label="Invalid fields">
        {[...errorFields]
          .filter(([, isValid]) => !isValid)
          .map(([key]) => key)
          .join(',')}
      </output>
      <button type="button" onClick={() => dispatch({ type: ValidationActionType.Reset })}>
        Reset validation
      </button>
    </>
  );
};

const renderView = () =>
  render(
    <SaveValidationContextProvider>
      <ValidationProbe />
      <AppRunnerAssetView etag="etag" originalRunner={runner} roles={[]} interceptors={[]} globalInterceptors={[]} />
    </SaveValidationContextProvider>,
  );

describe('AppRunnerAssetView response validation', () => {
  test('keeps Save disabled for an invalid response across route and tab switches and enables it after correction', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('tab', { name: TabsI18nKey.AppRoutes }));
    await user.click(await screen.findByRole('radio', { name: EntityFieldsI18nKey.response }));
    expect(await screen.findByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Reset validation' }));
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'other' }));
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    await user.click(screen.getByRole('tab', { name: TabsI18nKey.Properties, selected: false }));
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    await user.click(screen.getByRole('tab', { name: TabsI18nKey.AppRoutes }));
    await user.click(screen.getByRole('button', { name: 'health' }));

    const status = screen.getByRole('spinbutton', { name: EntityFieldsI18nKey.status });
    const body = screen.getByRole('textbox', { name: EntityFieldsI18nKey.body });
    await user.type(status, '99');
    await user.type(body, 'ok');
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    await user.clear(status);
    await user.type(status, '200');
    expect(screen.getByLabelText('Invalid fields')).toHaveTextContent(/^$/);
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeEnabled();
  });

  test('removes the aggregate validation entry when the runner view unmounts', async () => {
    const user = userEvent.setup();
    const { rerender } = renderView();

    await user.click(screen.getByRole('tab', { name: TabsI18nKey.AppRoutes }));
    await user.click(await screen.findByRole('radio', { name: EntityFieldsI18nKey.response }));
    expect(await screen.findByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    expect(screen.getByLabelText('Invalid fields')).toHaveTextContent('appRunnerRouteResponses');
    rerender(
      <SaveValidationContextProvider>
        <ValidationProbe />
      </SaveValidationContextProvider>,
    );
    expect(screen.getByLabelText('Invalid fields')).not.toHaveTextContent('appRunnerRouteResponses');
  });

  test('clears the response validation when the invalid route is deleted', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('tab', { name: TabsI18nKey.AppRoutes }));
    await user.click(await screen.findByRole('radio', { name: EntityFieldsI18nKey.response }));
    expect(await screen.findByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    const route = screen.getByRole('tab', { name: /health/ });
    await user.click(within(route).getByRole('button', { name: ButtonsI18nKey.Actions }));
    await user.click(screen.getByText('ActionMenuOperation.Delete'));
    expect(screen.getByLabelText('Invalid fields')).not.toHaveTextContent('appRunnerRouteResponses');
  });

  test('removes the response block when the output changes back to upstreams or changes are discarded', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('tab', { name: TabsI18nKey.AppRoutes }));
    await screen.findByRole('radio', { name: EntityFieldsI18nKey.response });
    await user.type(screen.getByRole('textbox', { name: /EntityFields.paths/ }), '2');
    await user.click(screen.getByRole('radio', { name: EntityFieldsI18nKey.response }));
    expect(await screen.findByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: EntityFieldsI18nKey.upstreams }));
    await user.type(screen.getByRole('textbox', { name: /UpstreamEndpoints.Endpoints/ }), 'https://service.example');
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeEnabled();
    expect(screen.getByRole('textbox', { name: /EntityFields.paths/ })).toHaveValue('/health2');

    await user.click(screen.getByRole('radio', { name: EntityFieldsI18nKey.response }));
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).not.toBeInTheDocument();
  });
});
