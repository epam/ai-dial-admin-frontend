import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { updateTranslator } from '@/src/app/[lang]/platform-translators/actions';
import { useNotification } from '@/src/context/NotificationContext';
import { NotificationType } from '@/src/models/notification';
import { DialTranslatorResource } from '@/src/models/dial/resource';
import TranslatorAssetView from '../View';

vi.mock('@/src/app/[lang]/platform-translators/actions', () => ({
  updateTranslator: vi.fn().mockResolvedValue({ success: true }),
  removeTranslator: vi.fn(),
  getTranslators: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({ onSave, onDiscard }: any) => (
    <>
      <button type="button" onClick={onSave}>
        save
      </button>
      <button type="button" onClick={onDiscard}>
        discard
      </button>
    </>
  ),
}));

vi.mock('../TabsContent', () => ({
  default: ({ selectedTranslator, onChange }: any) => (
    <div>
      <span>tabs-content</span>
      <span>{selectedTranslator.baseUrl}</span>
      <button type="button" onClick={() => onChange({ ...selectedTranslator, baseUrl: 'dial-plugin://other' })}>
        choose plugin
      </button>
    </div>
  ),
}));

const translator = (overrides: Partial<DialTranslatorResource> = {}): DialTranslatorResource =>
  ({
    name: 'to-responses',
    path: 'to-responses',
    folderId: '',
    in: 'anthropicMessages',
    out: 'openaiResponses',
    baseUrl: 'http://dial-bedrock-translator/to-responses',
    ...overrides,
  }) as DialTranslatorResource;

const clickSave = async (entity: DialTranslatorResource) => {
  const user = userEvent.setup();
  render(<TranslatorAssetView etag="etag" originalTranslator={entity} />);
  await user.click(screen.getByRole('button', { name: 'save' }));
};

describe('TranslatorAssetView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Should send the translator to Core with its etag on save', async () => {
    await clickSave(translator());

    expect(updateTranslator).toHaveBeenCalledWith(expect.objectContaining({ name: 'to-responses' }), 'etag');
  });

  test('saves the plugin reference with its etag and keeps failed edits', async () => {
    const user = userEvent.setup();
    vi.mocked(updateTranslator).mockResolvedValueOnce({
      success: false,
      errorHeader: 'Failure',
      errorMessage: 'Core rejected',
    });
    const original = translator({ baseUrl: 'dial-plugin://original/v2' });
    render(<TranslatorAssetView etag="etag" originalTranslator={original} />);

    await user.click(screen.getByRole('button', { name: 'choose plugin' }));
    await user.click(screen.getByRole('button', { name: 'save' }));

    await act(async () => {});
    expect(useNotification().showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.error, title: 'Failure', description: 'Core rejected' }),
    );
    expect(updateTranslator).toHaveBeenCalledWith({ ...original, baseUrl: 'dial-plugin://other' }, 'etag');
    expect(screen.getByText('dial-plugin://other')).toBeInTheDocument();
  });

  test('discards a changed plugin and restores the full original reference', async () => {
    const user = userEvent.setup();
    render(
      <TranslatorAssetView etag="etag" originalTranslator={translator({ baseUrl: 'dial-plugin://original/v2' })} />,
    );

    await user.click(screen.getByRole('button', { name: 'choose plugin' }));
    await user.click(screen.getByRole('button', { name: 'discard' }));

    expect(screen.getByText('dial-plugin://original/v2')).toBeInTheDocument();
  });

  test('Should render the tabs content', () => {
    render(<TranslatorAssetView etag="etag" originalTranslator={translator()} />);

    expect(screen.getByText('tabs-content')).toBeInTheDocument();
  });
});
