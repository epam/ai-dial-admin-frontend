import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import Properties from '@/src/components/EntityMainProperties/Properties/Properties';
import { EntityPlaceholdersI18nKey, PluginI18nKey } from '@/src/constants/i18n';
import { DialPluginResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { saveValidationMock } from '@/test-mocks/save-validation';

vi.mock('@/src/components/Common/JsonEditorInput/JsonEditorInput', () => ({
  default: ({ value, onChangeValue }: any) => (
    <button type="button" onClick={() => onChangeValue({ greeting: 'hello' })}>
      settings:{JSON.stringify(value)}
    </button>
  ),
}));

const { dispatch } = saveValidationMock;

const renderCreateForm = (
  onChangeEntity: (entity: object) => void,
  entity = {} as DialPluginResource,
  names: string[] = [],
) =>
  render(
    <Properties
      view={ApplicationRoute.PlatformPlugins}
      entity={entity}
      names={names}
      isModal
      onChangeEntity={onChangeEntity}
    />,
  );

/**
 * The create modal reaches this form through the shared `Properties` dispatcher. Falling through to the
 * generic entity form always seeds `displayName`/`description`, which Core's `Plugin` does not have.
 */
describe('Plugin asset :: create form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('writes the name the user types to name', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity);

    fireEvent.change(screen.getByRole('textbox', { name: /id/i }), { target: { value: 'my-plugin' } });

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ name: 'my-plugin' }));
  });

  test('renders only the name and type inputs, with no display name or description', () => {
    renderCreateForm(vi.fn());

    expect(screen.getAllByRole('textbox')).toHaveLength(2);
    expect(screen.getByRole('textbox', { name: `${PluginI18nKey.Type}(required)` })).toHaveAttribute(
      'placeholder',
      EntityPlaceholdersI18nKey.Type,
    );
  });

  test('writes the entered type and marks it valid', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity);

    fireEvent.change(screen.getByRole('textbox', { name: `${PluginI18nKey.Type}(required)` }), {
      target: { value: 'forward' },
    });

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ type: 'forward' }));
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ field: 'type', isValid: true }));
  });

  test('reports a blank type as invalid and shows the required message', () => {
    renderCreateForm(vi.fn(), { name: 'my-plugin', type: '   ' } as DialPluginResource);

    expect(screen.getByText(PluginI18nKey.TypeRequired)).toBeInTheDocument();
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ field: 'type', isValid: false }));
  });

  test('starts with the type invalid when none is given, without showing an error yet', () => {
    renderCreateForm(vi.fn());

    expect(screen.queryByText(PluginI18nKey.TypeRequired)).not.toBeInTheDocument();
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ field: 'type', isValid: false }));
  });

  test('marks the name invalid when it is already taken', () => {
    renderCreateForm(vi.fn(), { name: 'my-plugin', type: 'forward' } as DialPluginResource, ['my-plugin']);

    fireEvent.change(screen.getByRole('textbox', { name: /id/i }), { target: { value: 'my-plugin' } });

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ field: 'name', isValid: false }));
  });

  test('marks a name containing a slash invalid', () => {
    renderCreateForm(vi.fn(), { type: 'forward' } as DialPluginResource);

    fireEvent.change(screen.getByRole('textbox', { name: /id/i }), { target: { value: 'a/b' } });

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ field: 'name', isValid: false }));
  });

  test('shows empty settings by default and writes edited settings', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity);

    fireEvent.click(screen.getByRole('button', { name: 'settings:{}' }));

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ settings: { greeting: 'hello' } }));
  });
});
