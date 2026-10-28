import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import AssetVersion from '@/src/components/BaseControls/AssetVersion';
import { EntityFieldsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { ResourceType } from '@/src/types/resource-type';

const props = { name: 'app', folderId: 'public/', resourceType: ResourceType.APPLICATION, version: 'stable' };

describe('AssetVersion', () => {
  beforeEach(() => vi.clearAllMocks());

  test('accepts a text label and forwards edits', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AssetVersion {...props} onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: new RegExp(EntityFieldsI18nKey.version) });
    expect(input).toHaveValue('stable');
    await user.type(input, '2');
    expect(onChange).toHaveBeenCalledWith('stable2');
  });

  test('reports an ambiguous version with field feedback', () => {
    render(<AssetVersion {...props} version="_preview" />);
    expect(screen.getByText(ErrorI18nKey.AmbiguousAssetVersion)).toBeInTheDocument();
    expect(useSaveValidationContext().dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: ValidationActionType.SetField, isValid: false }),
    );
  });

  test('rechecks the full destination when its folder changes', () => {
    const existingPaths = ['public/other/app__stable'];
    const { rerender } = render(<AssetVersion {...props} existingPaths={existingPaths} />);
    expect(screen.queryByText(ErrorI18nKey.NameVersionCombination)).toBeNull();
    rerender(<AssetVersion {...props} folderId="public/other/" existingPaths={existingPaths} />);
    expect(screen.getByText(ErrorI18nKey.NameVersionCombination)).toBeInTheDocument();
  });

  test.each([ResourceType.APPLICATION, ResourceType.TOOLSET])(
    'rechecks combined length and restores validity after name or version changes for %s',
    (resourceType) => {
      const name = 'a'.repeat(100);
      const version = 'b'.repeat(153);
      const dispatch = useSaveValidationContext().dispatch;
      const { rerender } = render(
        <AssetVersion {...props} resourceType={resourceType} name={name} version={version} />,
      );
      const input = screen.getByRole('textbox', { name: new RegExp(EntityFieldsI18nKey.version) });
      expect(screen.queryByText(ErrorI18nKey.AssetNameVersionTooLong)).toBeNull();
      expect(input).not.toHaveAttribute('aria-invalid', 'true');

      vi.clearAllMocks();
      rerender(<AssetVersion {...props} resourceType={resourceType} name={`${name}a`} version={version} />);
      expect(screen.getByText(ErrorI18nKey.AssetNameVersionTooLong)).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: ValidationActionType.SetField, isValid: false }),
      );

      vi.clearAllMocks();
      rerender(<AssetVersion {...props} resourceType={resourceType} name={name} version={version} />);
      expect(screen.queryByText(ErrorI18nKey.AssetNameVersionTooLong)).toBeNull();
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: ValidationActionType.SetField, isValid: true }),
      );

      vi.clearAllMocks();
      rerender(<AssetVersion {...props} resourceType={resourceType} name={name} version={`${version}b`} />);
      expect(screen.getByText(ErrorI18nKey.AssetNameVersionTooLong)).toBeInTheDocument();
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: ValidationActionType.SetField, isValid: false }),
      );

      vi.clearAllMocks();
      rerender(<AssetVersion {...props} resourceType={resourceType} name={name} version={version} />);
      expect(screen.queryByText(ErrorI18nKey.AssetNameVersionTooLong)).toBeNull();
      expect(input).not.toHaveAttribute('aria-invalid', 'true');
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: ValidationActionType.SetField, isValid: true }),
      );
    },
  );

  test('cleans up its validation field when unmounted', () => {
    const { unmount } = render(<AssetVersion {...props} version="" />);
    unmount();
    expect(useSaveValidationContext().dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: ValidationActionType.RemoveField }),
    );
  });
});
