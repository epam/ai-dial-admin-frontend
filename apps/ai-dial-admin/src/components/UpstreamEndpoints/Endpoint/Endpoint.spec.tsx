import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';
import { UpstreamAuthType } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { saveValidationDispatch } = vi.hoisted(() => ({ saveValidationDispatch: vi.fn() }));

vi.mock('@/src/context/SaveValidationContext', () => ({
  useSaveValidationContext: () => ({ dispatch: saveValidationDispatch, resetCounter: 0 }),
  ValidationActionType: {
    SetField: 'SET_FIELD_VALIDATION',
    RemoveField: 'REMOVE_FIELD_VALIDATION',
  },
}));
import Endpoint from './Endpoint';

const baseEndpoint = {
  endpoint: 'http://test',
  key: 'key',
  weight: 1,
  tier: 2,
  extraData: undefined,
};

describe('Endpoint', () => {
  let updateEndpoint: any;
  let removeEndpoint: any;

  beforeEach(() => {
    vi.clearAllMocks();
    updateEndpoint = vi.fn();
    removeEndpoint = vi.fn();
  });

  test('renders line 1 fields and remove button by default', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamEndpoint)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Weight)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Tier)).toBeInTheDocument();
    expect(screen.getByLabelText('remove')).toBeInTheDocument();
    // Key and extraData are behind the collapse toggle by default
    expect(screen.queryByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamKey)).not.toBeInTheDocument();
    expect(screen.queryByText(EntityFieldsI18nKey.extraData)).not.toBeInTheDocument();
  });

  test('renders key and extraData fields after expanding', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    fireEvent.click(screen.getByLabelText('toggle expanded fields'));
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamKey)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.extraData)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.secretExtraData)).toBeInTheDocument();
  });

  test('collapses key and extraData fields on second toggle click', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    fireEvent.click(screen.getByLabelText('toggle expanded fields'));
    fireEvent.click(screen.getByLabelText('toggle expanded fields'));
    expect(screen.queryByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamKey)).not.toBeInTheDocument();
    expect(screen.queryByText(EntityFieldsI18nKey.extraData)).not.toBeInTheDocument();
  });

  test('calls updateEndpoint on endpoint url change', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamEndpoint), {
      target: { value: 'new-url' },
    });
    expect(updateEndpoint).toHaveBeenCalledWith({ ...baseEndpoint, endpoint: 'new-url' });
  });

  test('calls updateEndpoint on weight and tier change', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Weight), { target: { value: '5' } });
    expect(updateEndpoint).toHaveBeenCalledWith({ ...baseEndpoint, weight: 5 });
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Tier), { target: { value: '3' } });
    expect(updateEndpoint).toHaveBeenCalledWith({ ...baseEndpoint, tier: 3 });
  });

  test('renders base url field after expanding, alongside key', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    fireEvent.click(screen.getByLabelText('toggle expanded fields'));
    expect(screen.getByText(EntityFieldsI18nKey.baseUrl)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamKey)).toBeInTheDocument();
  });

  test('calls updateEndpoint on base url change after expanding, independently of endpoint', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    fireEvent.click(screen.getByLabelText('toggle expanded fields'));
    fireEvent.change(screen.getByLabelText(EntityFieldsI18nKey.baseUrl), {
      target: { value: 'http://base' },
    });
    expect(updateEndpoint).toHaveBeenCalledWith({ ...baseEndpoint, baseUrl: 'http://base' });
  });

  test('calls updateEndpoint on key change after expanding', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    fireEvent.click(screen.getByLabelText('toggle expanded fields'));
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamKey), {
      target: { value: 'new-key' },
    });
    expect(updateEndpoint).toHaveBeenCalledWith({ ...baseEndpoint, key: 'new-key' });
  });

  test('calls removeEndpoint on remove button click', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    fireEvent.click(screen.getByLabelText('remove'));
    expect(removeEndpoint).toHaveBeenCalledWith(0);
  });

  test('does not render remove button if disabled', () => {
    render(
      <Endpoint
        index={0}
        disabled={true}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Remove })).toBeNull();
  });

  test('renders id input and calls updateEndpoint on id change when view is Models', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        view={ApplicationRoute.Models}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamId)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamId), {
      target: { value: 'new-id' },
    });
    expect(updateEndpoint).toHaveBeenCalledWith({ ...baseEndpoint, id: 'new-id' });
  });

  test('does not render id input when view is not Models', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    expect(screen.queryByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamId)).not.toBeInTheDocument();
  });

  test('does not render responses endpoint when withResponses is false', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        withResponses={false}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    expect(screen.queryByPlaceholderText(EntityPlaceholdersI18nKey.ResponsesEndpoint)).not.toBeInTheDocument();
  });

  test('renders the authentication selector only when platform routes enable it', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        view={ApplicationRoute.PlatformRoutes}
        isAuthTypeSupported
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );

    fireEvent.click(screen.getByLabelText('toggle expanded fields'));
    expect(screen.getByText('UpstreamEndpoints.AuthenticationType')).toBeInTheDocument();
    expect(screen.getByText('UpstreamEndpoints.ApiKey')).toBeInTheDocument();
  });

  test('requires a replacement key for a newly configured Bearer upstream', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={{ endpoint: 'http://test', authType: UpstreamAuthType.BEARER } as any}
        view={ApplicationRoute.PlatformRoutes}
        isAuthTypeSupported
        isBearerKeyRequired
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );

    fireEvent.click(screen.getByLabelText('toggle expanded fields'));
    expect(screen.getByText(ErrorI18nKey.RequiredField)).toBeInTheDocument();
  });

  test('keeps an empty interface endpoint optional when the upstream Base URL is populated', async () => {
    const user = userEvent.setup();
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={{
          ...baseEndpoint,
          id: 'upstream',
          baseUrl: 'https://upstream',
          interfaces: { [DeploymentInterfaceType.OpenAIChatCompletions]: { endpoint: undefined } },
        }}
        view={ApplicationRoute.PlatformModels}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'toggle expanded fields' }));

    expect(screen.getByRole('textbox', { name: EntityFieldsI18nKey.endpoint })).toBeInTheDocument();
    expect(screen.queryByText(ErrorI18nKey.RequiredField)).toBeNull();
    expect(saveValidationDispatch).toHaveBeenCalledWith({
      type: 'SET_FIELD_VALIDATION',
      field: 'upstream-interfaces-0',
      isValid: true,
    });
  });

  test('keeps a missing interface endpoint invalid after upstream details collapse', async () => {
    const user = userEvent.setup();
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={{
          ...baseEndpoint,
          id: 'upstream',
          interfaces: { [DeploymentInterfaceType.OpenAIChatCompletions]: { endpoint: undefined } },
        }}
        view={ApplicationRoute.PlatformModels}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'toggle expanded fields' }));
    expect(screen.getByText(ErrorI18nKey.RequiredField)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'toggle expanded fields' }));

    expect(saveValidationDispatch).toHaveBeenCalledWith({
      type: 'SET_FIELD_VALIDATION',
      field: 'upstream-interfaces-0',
      isValid: false,
    });
    expect(saveValidationDispatch).not.toHaveBeenCalledWith({
      type: 'REMOVE_FIELD_VALIDATION',
      field: 'upstream-interfaces-0',
    });
  });

  test('does not require the hidden key of an unchanged Bearer upstream', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={{ endpoint: 'http://test', authType: UpstreamAuthType.BEARER } as any}
        view={ApplicationRoute.PlatformRoutes}
        isAuthTypeSupported
        isBearerKeyRequired={false}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );

    expect(screen.queryByText(ErrorI18nKey.RequiredField)).toBeNull();
  });
});
