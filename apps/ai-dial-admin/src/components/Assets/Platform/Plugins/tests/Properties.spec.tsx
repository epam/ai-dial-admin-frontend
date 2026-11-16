import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey, PluginI18nKey } from '@/src/constants/i18n';
import { DialPluginResource } from '@/src/models/dial/resource';
import PluginAssetProperties from '../Properties';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

vi.mock('@/src/components/Common/JsonEditorInput/JsonEditorInput', () => ({
  default: ({ value }: any) => <div>settings:{JSON.stringify(value)}</div>,
}));

const baseAsset = { name: 'my-plugin', type: 'forward', settings: { deployment: 'gpt-4' } } as DialPluginResource;

const renderProperties = (asset: Partial<DialPluginResource> = {}, onChange = vi.fn()) =>
  render(<PluginAssetProperties asset={{ ...baseAsset, ...asset }} onChange={onChange} />);

describe('Plugin asset Properties', () => {
  test('shows the type with its value and the settings', () => {
    renderProperties();

    expect(screen.getByRole('textbox', { name: `${PluginI18nKey.Type}(required)` })).toHaveValue('forward');
    expect(screen.getByText('settings:{"deployment":"gpt-4"}')).toBeInTheDocument();
  });

  test('shows the preview notice', () => {
    renderProperties();

    expect(screen.getByRole('note')).toHaveTextContent(PluginI18nKey.PreviewNotice);
  });

  test('shows no editable name, display name, description or topics control', () => {
    renderProperties();

    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.queryByText(EntityFieldsI18nKey.displayName)).not.toBeInTheDocument();
    expect(screen.queryByText(EntityFieldsI18nKey.description)).not.toBeInTheDocument();
  });

  test('exposes the no-secrets hint on a keyboard-focusable control named by the hint', async () => {
    const user = userEvent.setup();
    renderProperties();

    const hint = screen.getByRole('button', { name: PluginI18nKey.SettingsHint });
    await user.tab();
    await user.tab();

    expect(hint).toHaveFocus();
  });

  test('calls onChange with the edited type', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderProperties({}, onChange);

    await user.type(screen.getByRole('textbox', { name: `${PluginI18nKey.Type}(required)` }), 'x');

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'forwardx' }));
  });
});
