import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, useState } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import ResourceAuthTypeSection from '@/src/components/Assets/Resources/Auth/ResourceAuthTypeSection';
import ResourceMultiAuth from '@/src/components/Assets/Resources/Auth/ResourceMultiAuth';
import ClientIdControl from '@/src/components/Toolsets/Auth/Controls/ClientIdControl';
import ClientSecretControl from '@/src/components/Toolsets/Auth/Controls/ClientSecretControl';
import { getAuthTypeStorageKey } from '@/src/components/Toolsets/Auth/utils';
import { ButtonsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import {
  SaveValidationContextProvider,
  useSaveValidationContext,
  ValidationActionType,
} from '@/src/context/SaveValidationContext';
import { DialApplicationResource, ToolsetAuthType } from '@/src/models/dial/resource';

vi.unmock('@/src/context/SaveValidationContext');

const ValidationStatus = () => {
  const { isValid, errorFields, dispatch } = useSaveValidationContext();

  return (
    <>
      <button disabled={!isValid}>Save</button>
      <button onClick={() => dispatch({ type: ValidationActionType.SetField, field: 'other', isValid: false })}>
        Invalidate other field
      </button>
      <output aria-label="Validation fields">{JSON.stringify(Object.fromEntries(errorFields))}</output>
    </>
  );
};

const CredentialsHarness = ({ clientId, clientSecret }: { clientId: string; clientSecret: string }) => {
  const [isIdVisible, setIsIdVisible] = useState(true);
  const [isSecretVisible, setIsSecretVisible] = useState(true);

  return (
    <SaveValidationContextProvider>
      <button onClick={() => setIsIdVisible(!isIdVisible)}>Toggle client ID</button>
      <button onClick={() => setIsSecretVisible(!isSecretVisible)}>Toggle client secret</button>
      {isIdVisible && <ClientIdControl clientId={clientId} />}
      {isSecretVisible && <ClientSecretControl clientSecret={clientSecret} />}
      <ValidationStatus />
    </SaveValidationContextProvider>
  );
};

const fields = () => JSON.parse(screen.getByLabelText('Validation fields').textContent || '{}');

describe('Credential validation lifecycle', () => {
  afterEach(() => {
    sessionStorage.removeItem(getAuthTypeStorageKey('test-asset'));
  });

  test.each([
    {
      name: 'client ID',
      clientId: '',
      clientSecret: 'valid-secret',
      field: 'authSettings.clientId',
      other: 'authSettings.clientSecret',
    },
    {
      name: 'client secret',
      clientId: 'valid-id',
      clientSecret: '',
      field: 'authSettings.clientSecret',
      other: 'authSettings.clientId',
    },
  ])(
    'removes only the hidden $name validation and validates it again on remount',
    async ({ name, clientId, clientSecret, field, other }) => {
      const user = userEvent.setup();
      render(<CredentialsHarness clientId={clientId} clientSecret={clientSecret} />);

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
      expect(fields()).toMatchObject({ [field]: false, [other]: true });

      await user.click(screen.getByRole('button', { name: `Toggle ${name}` }));
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
      expect(fields()).toEqual({ [other]: true });

      await user.click(screen.getByRole('button', { name: `Toggle ${name}` }));
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
      expect(fields()).toMatchObject({ [field]: false, [other]: true });
    },
  );

  test('preserves an unrelated invalid field when both credentials are hidden', async () => {
    const user = userEvent.setup();
    render(<CredentialsHarness clientId="" clientSecret="" />);
    await user.click(screen.getByRole('button', { name: 'Invalidate other field' }));
    await user.click(screen.getByRole('button', { name: 'Toggle client ID' }));
    await user.click(screen.getByRole('button', { name: 'Toggle client secret' }));

    expect(fields()).toEqual({ other: false });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  test('retains invalid credential validation through StrictMode effect replay', () => {
    render(
      <StrictMode>
        <CredentialsHarness clientId="" clientSecret="" />
      </StrictMode>,
    );

    expect(fields()).toMatchObject({ 'authSettings.clientId': false, 'authSettings.clientSecret': false });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  test('clears credential validation when leaving an external service editor', async () => {
    const user = userEvent.setup();
    const asset = {
      external_services: {
        service: {
          auth_settings: {
            authentication_type: ToolsetAuthType.OAUTH,
            authorization_endpoint: 'https://example.com/auth',
            token_endpoint: 'https://example.com/token',
          },
        },
      },
    } as unknown as DialApplicationResource;

    render(
      <SaveValidationContextProvider>
        <ResourceMultiAuth asset={asset} onChange={vi.fn()} />
        <ValidationStatus />
      </SaveValidationContextProvider>,
    );

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Edit }));
    expect(screen.getByLabelText(/EntityFields\.clientId/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Back }));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Edit })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(fields()).not.toHaveProperty('authSettings.clientId');
    expect(fields()).not.toHaveProperty('authSettings.clientSecret');
  });

  test('clears credential validation when Assets switches from configuration to login', async () => {
    const user = userEvent.setup();
    sessionStorage.removeItem(getAuthTypeStorageKey('test-asset'));
    render(
      <SaveValidationContextProvider>
        <ResourceAuthTypeSection
          toolsetName="test-asset"
          config={{ id: ToolsetAuthType.OAUTH, title: 'OAuth' }}
          isSelected
          authSettings={{
            authentication_type: ToolsetAuthType.OAUTH,
            authorization_endpoint: 'https://example.com/auth',
            token_endpoint: 'https://example.com/token',
          }}
        />
        <ValidationStatus />
      </SaveValidationContextProvider>,
    );

    await user.click(screen.getByRole('radio', { name: ToolsetI18nKey.WithLoginAndConfig }));
    expect(screen.getByLabelText(/EntityFields\.clientId/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/EntityFields\.clientSecret/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: ToolsetI18nKey.WithLogin }));
    expect(screen.queryByLabelText(/EntityFields\.clientId/i)).toBeNull();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(fields()).not.toHaveProperty('authSettings.clientId');
    expect(fields()).not.toHaveProperty('authSettings.clientSecret');

    await user.click(screen.getByRole('radio', { name: ToolsetI18nKey.WithLoginAndConfig }));
    expect(screen.getByLabelText(/EntityFields\.clientId/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});
