import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, ResourceDependenciesI18nKey } from '@/src/constants/i18n';
import { ResourceAccess } from '@/src/models/dial/resource-dependency';
import DependencyModal from '../DependencyModal';
import { DependencyFormValues } from '../models';

const EMPTY: DependencyFormValues = { linkId: '', path: '', access: [ResourceAccess.Read], isRequired: false };

describe('DependencyModal', () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (props?: Partial<React.ComponentProps<typeof DependencyModal>>) =>
    render(
      <DependencyModal initialValues={EMPTY} otherLinkIds={[]} onClose={onClose} onConfirm={onConfirm} {...props} />,
    );

  const linkIdInput = () => screen.getByRole('textbox', { name: new RegExp(ResourceDependenciesI18nKey.LinkId) });
  const pathInput = () => screen.getByRole('textbox', { name: new RegExp(ResourceDependenciesI18nKey.TargetPath) });
  const readBox = () => screen.getByRole('checkbox', { name: ResourceDependenciesI18nKey.Read });
  const writeBox = () => screen.getByRole('checkbox', { name: ResourceDependenciesI18nKey.Write });
  const submit = () => screen.getByRole('button', { name: ButtonsI18nKey.Add });

  // The kit's popup takes focus on the first click, so typing would drop its first characters.
  const setText = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } });

  const fill = (linkId: string, path: string) => {
    setText(linkIdInput(), linkId);
    setText(pathInput(), path);
  };

  describe('DependencyModal — add', () => {
    test('renders the fields with Read preselected and Add disabled', () => {
      renderModal();

      expect(screen.getByText(ResourceDependenciesI18nKey.AddDependency)).toBeTruthy();
      expect(readBox()).toBeChecked();
      expect(writeBox()).not.toBeChecked();
      expect(screen.getByRole('switch', { name: new RegExp(ResourceDependenciesI18nKey.Required) })).not.toBeChecked();
      expect(screen.getByText(ResourceDependenciesI18nKey.RequiredDescription)).toBeTruthy();
      expect(submit()).toBeDisabled();
    });

    test('passes the placeholder examples to the path input', () => {
      renderModal();

      expect(pathInput().getAttribute('placeholder')).toBe(ResourceDependenciesI18nKey.TargetPathPlaceholder);
    });

    test('enables Add once both fields hold valid values and submits them', async () => {
      renderModal();

      fill('docs', 'files/public/folder/');

      expect(submit()).toBeEnabled();
      await user.click(submit());

      expect(onConfirm).toHaveBeenCalledOnce();
      expect(onConfirm).toHaveBeenCalledWith({
        linkId: 'docs',
        path: 'files/public/folder/',
        access: [ResourceAccess.Read],
        isRequired: false,
      });
    });

    test('cancelling closes without confirming', async () => {
      renderModal();

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

      expect(onClose).toHaveBeenCalledOnce();
      expect(onConfirm).not.toHaveBeenCalled();
    });

    test('submits the Required switch state', async () => {
      renderModal();

      fill('docs', 'files/public/folder/');
      await user.click(screen.getByRole('switch', { name: new RegExp(ResourceDependenciesI18nKey.Required) }));
      await user.click(submit());

      expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ isRequired: true }));
    });
  });

  describe('DependencyModal — access', () => {
    test('selecting Write selects Read and locks it', async () => {
      renderModal();

      await user.click(writeBox());

      expect(writeBox()).toBeChecked();
      expect(readBox()).toBeChecked();
      expect(readBox()).toBeDisabled();
    });

    test('deselecting Write unlocks Read', async () => {
      renderModal({ initialValues: { ...EMPTY, access: [ResourceAccess.Read, ResourceAccess.Write] } });

      await user.click(writeBox());

      expect(readBox()).toBeEnabled();
      expect(readBox()).toBeChecked();
    });

    test('deselecting every right shows a message and disables Add', async () => {
      renderModal({
        initialValues: { linkId: 'docs', path: 'files/public/x', access: [ResourceAccess.Read], isRequired: false },
      });

      await user.click(readBox());

      expect(screen.getByRole('alert').textContent).toBe(ResourceDependenciesI18nKey.AccessRequired);
      expect(submit()).toBeDisabled();
    });
  });

  describe('DependencyModal — validation', () => {
    test('stays quiet about an untouched empty field', () => {
      renderModal();

      expect(screen.queryByText(ResourceDependenciesI18nKey.LinkIdRequired)).toBeNull();
      expect(screen.queryByText(ResourceDependenciesI18nKey.PathRequired)).toBeNull();
    });

    test('rejects a path with an unknown root and disables Add', async () => {
      renderModal();

      fill('docs', 'models/public/x');

      expect(screen.getByText(ResourceDependenciesI18nKey.PathRoot)).toBeTruthy();
      expect(submit()).toBeDisabled();
    });

    test('rejects a link id another dependency already uses', async () => {
      renderModal({ otherLinkIds: ['docs'] });

      fill('docs', 'files/public/folder/');

      expect(screen.getByText(ResourceDependenciesI18nKey.LinkIdDuplicate)).toBeTruthy();
      expect(submit()).toBeDisabled();
    });

    test('clearing a touched field shows its required error', async () => {
      renderModal();

      setText(linkIdInput(), 'a');
      setText(linkIdInput(), '');

      expect(screen.getByText(ResourceDependenciesI18nKey.LinkIdRequired)).toBeTruthy();
    });
  });

  describe('DependencyModal — edit', () => {
    const initialValues: DependencyFormValues = {
      linkId: 'docs',
      path: 'files/public/folder/',
      access: [ResourceAccess.Read, ResourceAccess.Write],
      isRequired: true,
    };

    test('prefills the values and offers Save', () => {
      renderModal({ isEdit: true, initialValues });

      expect(screen.getByText(ResourceDependenciesI18nKey.EditDependency)).toBeTruthy();
      expect((linkIdInput() as HTMLInputElement).value).toBe('docs');
      expect((pathInput() as HTMLInputElement).value).toBe('files/public/folder/');
      expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeEnabled();
    });

    test('saves the changed values', async () => {
      renderModal({ isEdit: true, initialValues });

      setText(pathInput(), 'skills/{current-user}/');
      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

      expect(onConfirm).toHaveBeenCalledWith({ ...initialValues, path: 'skills/{current-user}/' });
    });
  });
});
