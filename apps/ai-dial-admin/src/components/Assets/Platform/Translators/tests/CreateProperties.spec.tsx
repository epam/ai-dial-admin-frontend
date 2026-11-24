import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import CreatePlatformEntityForm from '@/src/components/Assets/Platform/CreatePlatformEntityForm';
import Properties from '@/src/components/EntityMainProperties/Properties/Properties';
import { BasicI18nKey, ButtonsI18nKey, EntitiesI18nKey, EntityFieldsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import type { PluginOptions } from '@/src/server/config-entities/read-plugin-options';
import { NotificationType } from '@/src/models/notification';
import { DialTranslatorResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';

const renderCreateForm = (
  onChangeEntity: (entity: object) => void,
  entity = {} as DialTranslatorResource,
  plugins?: PluginOptions,
) =>
  render(
    <Properties
      view={ApplicationRoute.PlatformTranslators}
      entity={entity}
      names={[]}
      plugins={plugins}
      isModal
      onChangeEntity={onChangeEntity}
    />,
  );

/**
 * The create modal reaches this form through the shared `Properties` dispatcher. Falling through to
 * the generic entity form looks correct on screen but always seeds `displayName`/`description` —
 * neither of which `Translator` has — and Core rejects the whole write once either field is present.
 * Unlike `Route`/`Role`, Core's `Translator.class` also requires `out`/`baseUrl` on every write (and
 * rejects a registry entry declaring no `in`), so this form — unlike `RouteCreateProperties`/
 * `RoleCreateProperties` — collects those too.
 */
describe('Translator asset :: create form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Should write the name the user types to name', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity);

    fireEvent.change(screen.getByRole('textbox', { name: /id/i }), { target: { value: 'to-responses' } });

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ name: 'to-responses' }));
  });

  test('Should render no display-name or description control, only id and baseUrl', () => {
    renderCreateForm(vi.fn());

    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  test('Should render the in/out interface selects', () => {
    renderCreateForm(vi.fn());

    expect(screen.getByText(EntityFieldsI18nKey.translatorIn)).toBeTruthy();
    expect(screen.getByText(EntityFieldsI18nKey.translatorOut)).toBeTruthy();
  });

  test('offers surviving plugin options and writes the selected reference', async () => {
    const user = userEvent.setup();
    const onChangeEntity = vi.fn();
    const entity = { name: 'translator', in: 'anthropicMessages', out: 'openaiResponses' } as DialTranslatorResource;
    renderCreateForm(onChangeEntity, entity, { options: ['example'], error: EntitiesI18nKey.OptionListPartial });

    await user.click(screen.getByRole('radio', { name: BasicI18nKey.Plugin }));
    expect(screen.getByText(ErrorI18nKey.RequiredField)).toBeInTheDocument();
    expect(useSaveValidationContext().dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ field: 'baseUrl', isValid: false }),
    );
    expect(screen.getByRole('status')).toHaveTextContent(EntitiesI18nKey.OptionListPartial);
    await user.click(screen.getByRole('combobox', { name: BasicI18nKey.Plugin }));
    await user.click(screen.getByRole('option', { name: 'dial-plugin://example' }));

    expect(onChangeEntity).toHaveBeenLastCalledWith({ ...entity, baseUrl: 'dial-plugin://example' });
  });

  test('creates a translator with the selected plugin in the existing payload', async () => {
    const user = userEvent.setup();
    const createEntity = vi.fn().mockResolvedValue({ success: true });
    const onClose = vi.fn();
    const initialValues = { name: 'translator', in: 'anthropicMessages', out: 'openaiResponses' };
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as never);
    render(
      <CreatePlatformEntityForm
        view={ApplicationRoute.PlatformTranslators}
        isOpen
        names={[]}
        initialValues={initialValues}
        plugins={{ options: ['example'] }}
        createEntity={createEntity}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole('radio', { name: BasicI18nKey.Plugin }));
    await user.click(screen.getByRole('combobox', { name: BasicI18nKey.Plugin }));
    await user.click(screen.getByRole('option', { name: 'dial-plugin://example' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await act(async () => {});
    expect(createEntity).toHaveBeenCalledWith({
      name: 'translator',
      in: 'anthropicMessages',
      out: 'openaiResponses',
      baseUrl: 'dial-plugin://example',
      folderId: 'platform/',
    });
    expect(useNotification().showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.success }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  test('keeps a plugin draft and reports a failed create', async () => {
    const user = userEvent.setup();
    const createEntity = vi
      .fn()
      .mockResolvedValue({ success: false, errorHeader: 'Failure', errorMessage: 'Core rejected' });
    const onClose = vi.fn();
    const initialValues = { name: 'translator', in: 'anthropicMessages', out: 'openaiResponses' };
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as never);
    render(
      <CreatePlatformEntityForm
        view={ApplicationRoute.PlatformTranslators}
        isOpen
        names={[]}
        initialValues={initialValues}
        plugins={{ options: ['example'] }}
        createEntity={createEntity}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole('radio', { name: BasicI18nKey.Plugin }));
    await user.click(screen.getByRole('combobox', { name: BasicI18nKey.Plugin }));
    await user.click(screen.getByRole('option', { name: 'dial-plugin://example' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await act(async () => {});
    expect(useNotification().showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.error, title: 'Failure', description: 'Core rejected' }),
    );
    expect(createEntity).toHaveBeenCalledWith({
      ...initialValues,
      baseUrl: 'dial-plugin://example',
      folderId: 'platform/',
    });
    expect(screen.getByText('dial-plugin://example')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('Should write the entered base URL to baseUrl', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity);

    fireEvent.change(screen.getByRole('textbox', { name: BasicI18nKey.URL }), {
      target: { value: 'http://dial-bedrock-translator/to-responses' },
    });

    expect(onChangeEntity).toHaveBeenCalledWith(
      expect.objectContaining({ baseUrl: 'http://dial-bedrock-translator/to-responses' }),
    );
  });
});
