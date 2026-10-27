import { render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import AssetProperties from '@/src/components/EntityMainProperties/Properties/AssetProperties';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';

const entity = { name: 'app', displayName: 'App', version: '1.0.0' } as unknown as AssetWithVersion;

const renderProperties = (versionsMap: Record<string, string[]>, hideVersionField?: boolean) =>
  render(
    <AssetProperties
      view={ApplicationRoute.AssetsApplications}
      entity={entity}
      names={[]}
      versionsMap={versionsMap}
      hideVersionField={hideVersionField}
      onChangeEntity={vi.fn()}
    />,
  );

const versionValidity = (isValid: boolean) => ({ type: ValidationActionType.SetField, field: 'version', isValid });

describe('AssetProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('flags a name and version pair the folder already holds on mount', () => {
    renderProperties({ app: ['1.0.0'] });

    expect(useSaveValidationContext().dispatch).toHaveBeenLastCalledWith(versionValidity(false));
  });

  test('re-checks the version when the folder versions change, without a version edit', () => {
    const { rerender } = renderProperties({ app: ['1.0.0'] });

    rerender(
      <AssetProperties
        view={ApplicationRoute.AssetsApplications}
        entity={entity}
        names={[]}
        versionsMap={{}}
        onChangeEntity={vi.fn()}
      />,
    );

    expect(useSaveValidationContext().dispatch).toHaveBeenLastCalledWith(versionValidity(true));
  });

  test('leaves the version unvalidated while the field is hidden', () => {
    renderProperties({ app: ['1.0.0'] }, true);

    expect(useSaveValidationContext().dispatch).not.toHaveBeenCalledWith(versionValidity(false));
  });
});
