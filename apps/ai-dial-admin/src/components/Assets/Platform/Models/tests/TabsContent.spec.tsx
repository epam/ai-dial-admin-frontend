import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { AssetModel } from '@/src/models/dial/deployment-asset';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../TabsContent';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

vi.mock('@/src/app/[lang]/models/actions', () => ({
  getModelsTopics: vi.fn(() => Promise.resolve({ success: true, response: [] })),
  getModelsTokenizers: vi.fn(() => Promise.resolve({ success: true, response: [] })),
  getModelsAdapters: vi.fn(() => Promise.resolve({ success: true, response: [] })),
}));

const model = (overrides: Partial<AssetModel> = {}) =>
  ({ name: 'gpt-4', path: 'gpt-4', folderId: '', ...overrides }) as AssetModel;

const renderTabs = (onChange: (m: AssetModel) => void, overrides: Partial<AssetModel> = {}) => {
  const selected = model(overrides);

  return render(
    <TabsContent
      activeTab={EntityViewTab.Properties}
      selectedModel={selected}
      originalModel={selected}
      roles={[]}
      interceptors={[]}
      onChange={onChange}
    />,
  );
};

/**
 * Guards the merge in `onChangeResource`. A control that removes a key to mean "unset" is defeated by
 * merging its result over the previous model, and the control's own unit test still passes — so the
 * assertion has to run through this component to be worth anything.
 */
describe('Model asset TabsContent :: a removed field stays removed', () => {
  test('Should propagate a cleared tokenizer as an absent property, not restore the old value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    renderTabs(onChange, { tokenizerModel: 'cl100k_base' });
    await user.clear(screen.getByDisplayValue('cl100k_base'));

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0]).not.toHaveProperty('tokenizerModel');
  });

  test('Should still carry unrelated fields through an edit', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    renderTabs(onChange, { tokenizerModel: 'cl100k_base', displayName: 'Kept' });
    await user.clear(screen.getByDisplayValue('cl100k_base'));

    expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({ name: 'gpt-4', displayName: 'Kept' });
  });
});
