import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, ErrorI18nKey, ExternalServiceI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';

import {
  DialApplicationResource,
  DialExternalService,
  ToolsetAuthStatus,
  ToolsetAuthType,
} from '@/src/models/dial/resource';
import ResourceMultiAuth from '../ResourceMultiAuth';

let isReadOnlyAdmin = false;
vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: () => isReadOnlyAdmin,
}));

const baseAsset = {
  path: 'public/my-app',
  external_services: {
    'service-a': { display_name: 'Service A' },
    'service-b': { display_name: 'Service B' },
  },
} as unknown as DialApplicationResource;

const assetWithService = (service: DialExternalService): DialApplicationResource =>
  ({
    path: 'public/my-app',
    display_name: 'My App',
    external_services: { dial: service },
  }) as unknown as DialApplicationResource;

describe('ResourceMultiAuth', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    isReadOnlyAdmin = false;
  });

  test('adding a service with an ID that already exists shows an error and disables Apply', async () => {
    render(<ResourceMultiAuth asset={baseAsset} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: ExternalServiceI18nKey.AddService }));
    await user.type(screen.getByLabelText(ExternalServiceI18nKey.ServiceId, { exact: false }), 'service-a');

    expect(screen.getByText(ErrorI18nKey.NameExists)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Apply })).toBeDisabled();
  });

  test('renaming a service to an ID owned by a different entry shows an error and disables Apply', async () => {
    render(<ResourceMultiAuth asset={baseAsset} onChange={vi.fn()} />);

    // Rows render in insertion order: service-a first, service-b second.
    const [editServiceA] = screen.getAllByRole('button', { name: ButtonsI18nKey.Edit });
    await user.click(editServiceA);

    const idInput = screen.getByLabelText(ExternalServiceI18nKey.ServiceId, { exact: false });
    await user.clear(idInput);
    await user.type(idInput, 'service-b');

    expect(screen.getByText(ErrorI18nKey.NameExists)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Apply })).toBeDisabled();
  });

  test('renaming a service to its own original ID does not show the duplicate error', async () => {
    render(<ResourceMultiAuth asset={baseAsset} onChange={vi.fn()} />);

    const [editServiceA] = screen.getAllByRole('button', { name: ButtonsI18nKey.Edit });
    await user.click(editServiceA);

    const idInput = screen.getByLabelText(ExternalServiceI18nKey.ServiceId, { exact: false });
    expect(idInput).toHaveValue('service-a');

    expect(screen.queryByText(ErrorI18nKey.NameExists)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Apply })).not.toBeDisabled();
  });

  test('adding a service does not offer "Without authentication" as an auth type', async () => {
    render(<ResourceMultiAuth asset={baseAsset} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: ExternalServiceI18nKey.AddService }));

    expect(screen.queryByText(ToolsetI18nKey.NoneAuth)).not.toBeInTheDocument();
  });

  test('adding a service does not offer DIAL native as an auth type', async () => {
    render(<ResourceMultiAuth asset={baseAsset} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: ExternalServiceI18nKey.AddService }));

    expect(screen.queryByText(ToolsetI18nKey.DialNativeAuth)).not.toBeInTheDocument();
  });

  test('a DIAL native service that is not approved offers Grant consent', () => {
    const asset = assetWithService({
      auth_settings: {
        authentication_type: ToolsetAuthType.DIAL_NATIVE,
        app_level_auth_status: ToolsetAuthStatus.SIGNED_OUT,
      },
    });

    render(<ResourceMultiAuth asset={asset} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: ExternalServiceI18nKey.GrantConsent })).toBeInTheDocument();
    expect(screen.queryByText(ExternalServiceI18nKey.Approved)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ToolsetI18nKey.LogIn })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ToolsetI18nKey.LogOut })).not.toBeInTheDocument();
  });

  test('a DIAL native service that is approved shows the Approved badge and Withdraw consent', () => {
    const asset = assetWithService({
      auth_settings: {
        authentication_type: ToolsetAuthType.DIAL_NATIVE,
        app_level_auth_status: ToolsetAuthStatus.SIGNED_IN,
      },
    });

    render(<ResourceMultiAuth asset={asset} onChange={vi.fn()} />);

    expect(screen.getByText(ExternalServiceI18nKey.Approved)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ExternalServiceI18nKey.WithdrawConsent })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ToolsetI18nKey.LogIn })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ToolsetI18nKey.LogOut })).not.toBeInTheDocument();
  });

  test("a DIAL native service is not approved when only the viewing admin's own offline credentials exist", () => {
    const asset = assetWithService({
      auth_settings: {
        authentication_type: ToolsetAuthType.DIAL_NATIVE,
        user_level_auth_status: ToolsetAuthStatus.SIGNED_IN,
        app_level_auth_status: ToolsetAuthStatus.SIGNED_OUT,
      },
    });

    render(<ResourceMultiAuth asset={asset} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: ExternalServiceI18nKey.GrantConsent })).toBeInTheDocument();
    expect(screen.queryByText(ExternalServiceI18nKey.Approved)).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: ExternalServiceI18nKey.NotApproved })).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: ExternalServiceI18nKey.Approved })).not.toBeInTheDocument();
  });

  test('the status indicator reports approval, not sign-in, for a DIAL native row', () => {
    const asset = assetWithService({
      auth_settings: {
        authentication_type: ToolsetAuthType.DIAL_NATIVE,
        app_level_auth_status: ToolsetAuthStatus.SIGNED_IN,
      },
    });

    render(<ResourceMultiAuth asset={asset} onChange={vi.fn()} />);

    expect(screen.getByRole('status', { name: ExternalServiceI18nKey.Approved })).toBeInTheDocument();
  });

  test('the status indicator still reports sign-in state for an OAUTH row', () => {
    const asset = assetWithService({
      auth_settings: {
        authentication_type: ToolsetAuthType.OAUTH,
        user_level_auth_status: ToolsetAuthStatus.SIGNED_IN,
      },
    });

    render(<ResourceMultiAuth asset={asset} onChange={vi.fn()} />);

    expect(screen.getByRole('status', { name: ToolsetI18nKey.isAuthenticated })).toBeInTheDocument();
  });

  test('no status indicator is rendered for an unrecognised type', () => {
    const asset = assetWithService({
      auth_settings: { authentication_type: 'SOME_FUTURE_TYPE' as ToolsetAuthType },
    });

    render(<ResourceMultiAuth asset={asset} onChange={vi.fn()} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('an OAUTH service still offers Log in', () => {
    const asset = assetWithService({
      auth_settings: {
        authentication_type: ToolsetAuthType.OAUTH,
        app_level_auth_status: ToolsetAuthStatus.SIGNED_OUT,
      },
    });

    render(<ResourceMultiAuth asset={asset} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: ToolsetI18nKey.LogIn })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ExternalServiceI18nKey.GrantConsent })).not.toBeInTheDocument();
  });

  test('a DIAL native row offers no Edit or Delete — consent is its only mutation', () => {
    const asset = assetWithService({
      auth_settings: {
        authentication_type: ToolsetAuthType.DIAL_NATIVE,
        app_level_auth_status: ToolsetAuthStatus.SIGNED_OUT,
      },
    });

    render(<ResourceMultiAuth asset={asset} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: ExternalServiceI18nKey.GrantConsent })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Edit })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Delete })).not.toBeInTheDocument();
  });

  test('an OAUTH row keeps Edit and Delete', () => {
    const asset = assetWithService({ auth_settings: { authentication_type: ToolsetAuthType.OAUTH } });

    render(<ResourceMultiAuth asset={asset} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Edit })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Delete })).toBeInTheDocument();
  });

  test('an unrecognised type keeps Edit and Delete so it can still be removed', () => {
    const asset = assetWithService({
      auth_settings: { authentication_type: 'SOME_FUTURE_TYPE' as ToolsetAuthType },
    });

    render(<ResourceMultiAuth asset={asset} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Edit })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Delete })).toBeInTheDocument();
  });

  test('an unrecognised authentication type renders no action', () => {
    const asset = assetWithService({
      auth_settings: { authentication_type: 'SOME_FUTURE_TYPE' as ToolsetAuthType },
    });

    render(<ResourceMultiAuth asset={asset} onChange={vi.fn()} />);

    expect(screen.getByText(ExternalServiceI18nKey.NoActionAvailable)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ToolsetI18nKey.LogIn })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ExternalServiceI18nKey.GrantConsent })).not.toBeInTheDocument();
  });

  test('a read-only admin sees the approval state but no consent action', () => {
    isReadOnlyAdmin = true;
    const asset = assetWithService({
      auth_settings: {
        authentication_type: ToolsetAuthType.DIAL_NATIVE,
        app_level_auth_status: ToolsetAuthStatus.SIGNED_IN,
      },
    });

    render(<ResourceMultiAuth asset={asset} onChange={vi.fn()} />);

    expect(screen.getByText(ExternalServiceI18nKey.Approved)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ExternalServiceI18nKey.WithdrawConsent })).not.toBeInTheDocument();
  });

  test('a read-only admin sees no Grant consent action on a not-approved service', () => {
    isReadOnlyAdmin = true;
    const asset = assetWithService({
      auth_settings: {
        authentication_type: ToolsetAuthType.DIAL_NATIVE,
        app_level_auth_status: ToolsetAuthStatus.SIGNED_OUT,
      },
    });

    render(<ResourceMultiAuth asset={asset} onChange={vi.fn()} />);

    expect(screen.queryByRole('button', { name: ExternalServiceI18nKey.GrantConsent })).not.toBeInTheDocument();
  });
});
