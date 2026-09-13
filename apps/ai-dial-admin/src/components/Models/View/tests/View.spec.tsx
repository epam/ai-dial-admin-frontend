import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getCoreModel } from '@/src/app/[lang]/models/actions';
import { DialModel } from '@/src/models/dial/model';
import View from '../View';

vi.mock('@/src/app/[lang]/models/actions', () => ({
  getCoreModel: vi.fn().mockResolvedValue({ response: {} }),
  removeModel: vi.fn(),
  updateCoreModel: vi.fn(),
  updateModel: vi.fn(),
}));
vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({ default: () => <div>header</div> }));
vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({ default: () => <div>json-editor</div> }));
vi.mock('@/src/components/EntityView/Modals/EntityViewModals', () => ({ default: () => <div>modals</div> }));
vi.mock('../TabsContent', () => ({ default: () => <div>tabs-content</div> }));

const setEntityReadOnly = vi.fn();
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    featureFlags: { deploymentsEnabled: true, adminApiEnabled: true },
    setEntityReadOnly,
  }),
}));

const model: DialModel = { name: 'model-1' } as DialModel;

describe('Models View — config-file source', () => {
  test('does not call getCoreModel for a config-file-sourced model', () => {
    render(<View originalModel={model} names={[]} etag="etag" isConfigFileSource />);

    expect(getCoreModel).not.toHaveBeenCalled();
  });

  test('calls getCoreModel for an admin-backed model', () => {
    render(<View originalModel={model} names={[]} etag="etag" />);

    expect(getCoreModel).toHaveBeenCalledWith('model-1');
  });

  test('marks the entity read-only on mount when config-file-sourced, and clears it on unmount', () => {
    const { unmount } = render(<View originalModel={model} names={[]} etag="etag" isConfigFileSource />);

    expect(setEntityReadOnly).toHaveBeenCalledWith(true);

    unmount();

    expect(setEntityReadOnly).toHaveBeenLastCalledWith(false);
  });

  test('does not mark the entity read-only for an admin-backed model', () => {
    render(<View originalModel={model} names={[]} etag="etag" />);

    expect(setEntityReadOnly).toHaveBeenCalledWith(false);
  });
});
