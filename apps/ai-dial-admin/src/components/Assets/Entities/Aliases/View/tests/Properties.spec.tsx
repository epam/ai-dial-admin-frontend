import { appContextMock } from '@/test-mocks/app-context';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AliasI18nKey } from '@/src/constants/i18n';
import { DialAliasResource } from '@/src/models/dial/alias';
import { AliasHealthReason } from '@/src/models/dial/config-health';
import AliasProperties from '../Properties';

vi.mock('@/src/components/Assets/Resources/ResourceInfoHeader', () => ({
  default: () => <div>resource-info-header</div>,
}));
vi.mock('@/src/components/BaseControls/Icon', () => ({
  default: ({ iconUrl, onChange }: { iconUrl?: string; onChange: (url: string) => void }) => (
    <button onClick={() => onChange('icon.svg')}>{`icon:${iconUrl ?? ''}`}</button>
  ),
}));
vi.mock('@/src/components/BaseControls/DisplayName', () => ({
  default: ({ displayName, onChange }: { displayName?: string; onChange: (value: string) => void }) => (
    <input aria-label="display-name" value={displayName ?? ''} onChange={(event) => onChange(event.target.value)} />
  ),
}));
vi.mock('@/src/components/BaseControls/Description', () => ({
  default: ({ entity }: { entity: { description?: string } }) => (
    <span>{`description:${entity.description ?? ''}`}</span>
  ),
}));
vi.mock('@/src/components/BaseControls/Intro', () => ({
  default: ({ entity }: { entity: { intro?: string } }) => <span>{`intro:${entity.intro ?? ''}`}</span>,
}));
vi.mock('../InvalidAliasBanner', () => ({
  default: ({ issue }: { issue?: { reason: string } }) => <div>{`banner:${issue?.reason ?? 'none'}`}</div>,
}));

const alias = (overrides: Partial<DialAliasResource> = {}): DialAliasResource => ({
  name: 'assistant-v1',
  target: { path: 'models/gpt' },
  _metadata: { name: 'assistant-v1', path: 'platform/assistant-v1', folderId: 'platform/' },
  ...overrides,
});

describe('AliasProperties', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    appContextMock.set({ isReadOnlyAdmin: false });
  });

  const renderProperties = (
    asset: DialAliasResource = alias(),
    extra?: { healthIssue?: { id: string; reason: string } },
  ) => render(<AliasProperties asset={asset} onChange={onChange} {...extra} />);

  const nameField = () => screen.getByRole('textbox', { name: /EntityFields\.id|Id/i });

  test('shows the name of the alias and never lets it be edited', () => {
    renderProperties();

    expect(nameField()).toHaveProperty('value', 'assistant-v1');
    expect(nameField().hasAttribute('disabled')).toBe(true);
  });

  test('has no Called as field', () => {
    renderProperties();

    expect(screen.queryByRole('textbox', { name: /Called/i })).toBeNull();
  });

  describe('display fields', () => {
    test('writes an edited display name', () => {
      renderProperties(alias({ displayName: 'Assistant' }));

      fireEvent.change(screen.getByRole('textbox', { name: 'display-name' }), { target: { value: 'Helper' } });

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ displayName: 'Helper' }));
    });

    test('writes a picked icon', async () => {
      const user = userEvent.setup();
      renderProperties();

      await user.click(screen.getByRole('button', { name: 'icon:' }));

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ iconUrl: 'icon.svg' }));
    });

    test('writes a display version, and none at all when it is cleared', () => {
      renderProperties(alias({ displayVersion: '1.0' }));
      const version = screen.getByRole('textbox', { name: AliasI18nKey.DisplayVersion });

      fireEvent.change(version, { target: { value: '2.0' } });
      fireEvent.change(version, { target: { value: '' } });

      expect(onChange).toHaveBeenNthCalledWith(1, expect.objectContaining({ displayVersion: '2.0' }));
      expect(onChange).toHaveBeenNthCalledWith(2, expect.objectContaining({ displayVersion: undefined }));
    });

    test('shows the description and intro the alias has', () => {
      renderProperties(alias({ description: 'General purpose', intro: 'Hello' }));

      expect(screen.getByText('description:General purpose')).toBeTruthy();
      expect(screen.getByText('intro:Hello')).toBeTruthy();
    });
  });

  describe('health', () => {
    test('hands the health entry of Core to the banner', () => {
      renderProperties(alias(), {
        healthIssue: { id: 'aliases/assistant-v1', reason: AliasHealthReason.TargetMissing },
      });

      expect(screen.getByText(`banner:${AliasHealthReason.TargetMissing}`)).toBeTruthy();
    });

    test('keeps the fields editable under the banner', () => {
      renderProperties(alias(), {
        healthIssue: { id: 'aliases/assistant-v1', reason: AliasHealthReason.TargetMissing },
      });

      expect(screen.getByRole('textbox', { name: 'display-name' }).hasAttribute('disabled')).toBe(false);
    });
  });

  describe('read-only', () => {
    test('disables the version', () => {
      appContextMock.set({ isReadOnlyAdmin: true });

      renderProperties();

      expect(screen.getByRole('textbox', { name: AliasI18nKey.DisplayVersion }).hasAttribute('disabled')).toBe(true);
    });
  });
});
