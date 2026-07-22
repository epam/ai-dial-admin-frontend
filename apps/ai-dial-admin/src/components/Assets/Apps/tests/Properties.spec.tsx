import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ApplicationAssetProperties from '../Properties';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { DialApplicationResource } from '@/src/models/dial/resource';

vi.mock('@/src/components/Assets/Header/FolderStorage', () => ({ default: () => <div>folders-storage-label</div> }));
vi.mock('@/src/components/Assets/Resources/ResourceInfoHeader', () => ({
  default: () => <div>resource-info-header</div>,
}));
vi.mock('@/src/components/Assets/Resources/ResourceSourceField', () => ({
  default: () => <div>resource-source-field</div>,
}));
vi.mock('@/src/components/BaseControls/Icon', () => ({ default: () => <div>icon-control</div> }));
vi.mock('@/src/components/BaseControls/InterfacesField/InterfacesField', () => ({
  default: () => <div>interfaces-field</div>,
}));
vi.mock('@/src/components/BaseControls/MaxRetryAttempts', () => ({ default: () => <div>max-retry-attempts</div> }));
vi.mock('@/src/components/BaseControls/Topics', () => ({ default: () => <div>topics-control</div> }));
vi.mock('@/src/components/Common/FilePath/FilePath', () => ({ default: () => <div>file-path</div> }));
vi.mock('@/src/components/Defaults/Defaults', () => ({ default: () => <div>defaults</div> }));
vi.mock('@/src/components/Assets/Resources/Auth/ResourceMultiAuth', () => ({
  default: () => <div>resource-multi-auth</div>,
}));
vi.mock('@/src/components/EntityMainProperties/EntityAttachments/EntityAttachments', () => ({
  default: () => <div>entity-attachments</div>,
}));

const baseAsset: DialApplicationResource = {
  name: 'app-1',
  display_name: 'App 1',
} as DialApplicationResource;

describe('ApplicationAssetProperties', () => {
  test('renders an intro field alongside description', () => {
    render(<ApplicationAssetProperties asset={{ ...baseAsset, intro: 'Intro text' }} onChange={vi.fn()} />);

    expect(screen.getByText(EntityFieldsI18nKey.intro)).toBeInTheDocument();
    expect(screen.getAllByRole('textbox').some((el) => (el as HTMLTextAreaElement).value === 'Intro text')).toBe(true);
  });
});
