import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AssetModel } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../TabsContent';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

const { onRenderEntityAudit } = vi.hoisted(() => ({
  onRenderEntityAudit: vi.fn<(props: { entity: AssetModel; view: ApplicationRoute }) => void>(),
}));

vi.mock('@/src/components/EntityTabs/Audit/EntityAudit', () => ({
  default: (props: { entity: AssetModel; view: ApplicationRoute }) => {
    onRenderEntityAudit(props);
    return null;
  },
}));

vi.mock('@/src/app/[lang]/models/actions', () => ({
  getModelsTopics: vi.fn(() => Promise.resolve({ success: true, response: [] })),
  getModelsTokenizers: vi.fn(() => Promise.resolve({ success: true, response: [] })),
  getModelsAdapters: vi.fn(() => Promise.resolve({ success: true, response: [] })),
}));

const model = (overrides: Partial<AssetModel> = {}) =>
  ({ name: 'gpt-4', path: 'gpt-4', folderId: '', ...overrides }) as AssetModel;

const renderTabs = (
  onChange: (m: AssetModel) => void,
  overrides: Partial<AssetModel> = {},
  activeTab: EntityViewTab = EntityViewTab.Properties,
) => {
  const selected = model(overrides);

  render(
    <TabsContent
      activeTab={activeTab}
      selectedModel={selected}
      originalModel={selected}
      roles={[]}
      interceptors={[]}
      onChange={onChange}
    />,
  );

  return selected;
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

describe('Model asset TabsContent :: Audit tab', () => {
  beforeEach(() => {
    onRenderEntityAudit.mockClear();
  });

  test('Should render the audit view for the selected model under the platform models route', () => {
    const selected = renderTabs(vi.fn(), {}, EntityViewTab.Audit);

    expect(onRenderEntityAudit).toHaveBeenCalledOnce();
    expect(onRenderEntityAudit).toHaveBeenCalledWith(
      expect.objectContaining({ entity: selected, view: ApplicationRoute.PlatformModels }),
    );
  });

  test('Should not render the audit view on the Properties tab', () => {
    renderTabs(vi.fn(), {}, EntityViewTab.Properties);

    expect(onRenderEntityAudit).not.toHaveBeenCalled();
  });
});
