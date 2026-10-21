import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { updateTranslator } from '@/src/app/[lang]/platform-translators/actions';
import { DialTranslatorResource } from '@/src/models/dial/resource';
import TranslatorAssetView from '../View';

vi.mock('@/src/app/[lang]/platform-translators/actions', () => ({
  updateTranslator: vi.fn().mockResolvedValue({ success: true }),
  removeTranslator: vi.fn(),
  getTranslators: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({ onSave }: any) => (
    <button type="button" onClick={onSave}>
      save
    </button>
  ),
}));

vi.mock('../TabsContent', () => ({ default: () => <div>tabs-content</div> }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

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

  test('Should render the tabs content', () => {
    render(<TranslatorAssetView etag="etag" originalTranslator={translator()} />);

    expect(screen.getByText('tabs-content')).toBeInTheDocument();
  });
});
