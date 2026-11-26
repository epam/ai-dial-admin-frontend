import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import CreateApplication from '@/src/components/Assets/Entities/Apps/CreateApplication';
import { ButtonsI18nKey, EntityFieldsI18nKey, SourceI18nKey } from '@/src/constants/i18n';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { saveValidationMock } from '@/test-mocks/save-validation';

// Identity editing is unrelated to endpoint validation; retain the seeded identity.
vi.mock('@/src/components/EntityMainProperties/Properties/AssetProperties', () => ({
  default: () => null,
}));

const CHAT_URL = 'https://chat.example.com';
const MCP_URL = 'https://mcp.example.com';

describe('CreateApplication', () => {
  beforeEach(() => {
    saveValidationMock.useRealContext();
  });

  const renderEndpoints = async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue({ success: true });
    render(
      <SaveValidationContextProvider>
        <CreateApplication
          isOpen
          names={[]}
          getContext={() => ({ filePath: 'public/', fetchFiles: vi.fn() }) as never}
          initialValues={{ name: 'app', displayName: 'Application', endpoint: CHAT_URL }}
          onClose={vi.fn()}
          onCreate={onCreate}
        />
      </SaveValidationContextProvider>,
    );
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Next }));
    expect(await screen.findByRole('checkbox', { name: SourceI18nKey.ChatEndpoint })).toBeChecked();
    await waitFor(() => expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeEnabled());
    return { user, onCreate };
  };

  test('enables creation after switching from chat to a valid MCP endpoint', async () => {
    const { user, onCreate } = await renderEndpoints();
    await user.click(screen.getByRole('checkbox', { name: SourceI18nKey.McpEndpoint }));
    await user.click(screen.getByRole('checkbox', { name: SourceI18nKey.ChatEndpoint }));

    const create = screen.getByRole('button', { name: ButtonsI18nKey.Create });
    expect(create).toBeDisabled();
    await user.type(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.endpoint}(required)` }), MCP_URL);
    await waitFor(() => expect(create).toBeEnabled());
    await user.click(create);

    await vi.waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: undefined, mcp: expect.objectContaining({ endpoint: MCP_URL }) }),
    );
  });

  test('blocks creation for empty or invalid enabled fields even when another endpoint is valid', async () => {
    const { user } = await renderEndpoints();
    const create = screen.getByRole('button', { name: ButtonsI18nKey.Create });
    await user.click(screen.getByRole('checkbox', { name: SourceI18nKey.McpEndpoint }));
    expect(create).toBeDisabled();

    const mcpEndpoint = screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.endpoint}(required)` });
    await user.type(mcpEndpoint, 'not-a-url');
    expect(create).toBeDisabled();
    await user.clear(mcpEndpoint);
    await user.type(mcpEndpoint, MCP_URL);
    await waitFor(() => expect(create).toBeEnabled());

    const chatEndpoint = screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.completionEndpoint}(required)` });
    await user.clear(chatEndpoint);
    expect(create).toBeDisabled();
    await user.type(chatEndpoint, 'not-a-url');
    expect(create).toBeDisabled();

    await user.clear(chatEndpoint);
    await user.type(chatEndpoint, CHAT_URL);
    await waitFor(() => expect(create).toBeEnabled());
  });
});
