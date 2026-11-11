import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import CreatePolicyModal from '@/src/components/Assets/Platform/PolicySubjects/CreatePolicyModal';
import {
  ButtonsI18nKey,
  PoliciesI18nKey,
  PolicyAssignmentsI18nKey,
  PolicySubjectsI18nKey,
  TabsI18nKey,
} from '@/src/constants/i18n';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { PolicySubjectFunction } from '@/src/models/dial/policy';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/context/SaveValidationContext', async () => vi.importActual('@/src/context/SaveValidationContext'));

const nameInput = () => screen.getByRole('textbox', { name: /entityfields.id/i });
const costObjectInput = () => screen.getByRole('textbox', { name: new RegExp(PoliciesI18nKey.CostObject) });
const nextButton = () => screen.getByRole('button', { name: ButtonsI18nKey.Next });
const createButton = () => screen.getByRole('button', { name: ButtonsI18nKey.Create });

const renderModal = (filePath = 'platform/', names: string[] = [], route = ApplicationRoute.PlatformPolicies) => {
  const onCreate = vi.fn().mockResolvedValue({ success: true });
  const onClose = vi.fn();
  const context = { filePath } as AssetsFolderContextReader;
  render(
    <SaveValidationContextProvider>
      <CreatePolicyModal
        route={route}
        isOpen
        names={names}
        getContext={() => context}
        onClose={onClose}
        onCreate={onCreate}
      />
    </SaveValidationContextProvider>,
  );
  return { onCreate, onClose };
};

const fillDetails = () => {
  fireEvent.change(nameInput(), { target: { value: 'policy-one' } });
  fireEvent.change(screen.getByRole('spinbutton', { name: new RegExp(PoliciesI18nKey.Priority) }), {
    target: { value: '1' },
  });
  fireEvent.change(screen.getByRole('spinbutton', { name: new RegExp(PoliciesI18nKey.CostPerDay) }), {
    target: { value: '10' },
  });
};

const addValidRule = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: PolicySubjectsI18nKey.AddRule }));
  fireEvent.change(screen.getByRole('textbox', { name: new RegExp(PolicySubjectsI18nKey.Source) }), {
    target: { value: 'roles' },
  });
  const targets = screen.getByRole('textbox', { name: new RegExp(PolicySubjectsI18nKey.Targets) });
  await user.type(targets, 'admin{enter}');
};

describe('CreatePolicyModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });
  });

  test('locks the assignment cost object when created inside its folder', () => {
    renderModal('platform/team-a/', [], ApplicationRoute.PlatformPolicyAssignments);
    const costObject = screen.getByRole('textbox', { name: new RegExp(PolicyAssignmentsI18nKey.CostObject) });
    expect(costObject).toHaveValue('team-a');
    expect(costObject).toBeDisabled();
    expect(nextButton()).toBeDisabled();
  });

  test('requires a unique name, integer priority and a positive cost window before Next', () => {
    renderModal('platform/', ['taken']);
    expect(nextButton()).toBeDisabled();
    fillDetails();
    expect(nextButton()).toBeEnabled();
    fireEvent.change(nameInput(), { target: { value: 'taken' } });
    expect(nextButton()).toBeDisabled();
    fireEvent.change(nameInput(), { target: { value: 'policy-one' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: new RegExp(PoliciesI18nKey.CostPerDay) }), {
      target: { value: '0' },
    });
    expect(nextButton()).toBeDisabled();
    fireEvent.change(screen.getByRole('spinbutton', { name: new RegExp(PoliciesI18nKey.CostPerDay) }), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: new RegExp(PoliciesI18nKey.Priority) }), {
      target: { value: '' },
    });
    expect(nextButton()).toBeDisabled();
  });

  test('rejects characters that Core does not allow in names or cost objects', () => {
    renderModal();
    fillDetails();
    fireEvent.change(nameInput(), { target: { value: 'policy#one' } });
    expect(screen.getByText(PoliciesI18nKey.InvalidPathElement)).toBeInTheDocument();
    expect(nextButton()).toBeDisabled();
    fireEvent.change(nameInput(), { target: { value: 'policy-one' } });
    fireEvent.change(costObjectInput(), { target: { value: 'team+one' } });
    expect(screen.getByText(PoliciesI18nKey.InvalidPathElement)).toBeInTheDocument();
    expect(nextButton()).toBeDisabled();
    fireEvent.change(costObjectInput(), { target: { value: 'team-one' } });
    expect(nextButton()).toBeEnabled();
  });

  test('preserves details and subjects across Next and Back', async () => {
    const user = userEvent.setup();
    renderModal('platform/team-a/');
    fillDetails();
    await user.click(nextButton());
    await addValidRule(user);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Back }));
    expect(nameInput()).toHaveValue('policy-one');
    expect(costObjectInput()).toHaveValue('team-a');
    expect(screen.getByRole('spinbutton', { name: new RegExp(PoliciesI18nKey.CostPerDay) })).toHaveValue(10);
    await user.click(nextButton());
    expect(screen.getByRole('heading', { name: TabsI18nKey.Subjects })).toHaveFocus();
    expect(screen.getByRole('textbox', { name: new RegExp(PolicySubjectsI18nKey.Source) })).toHaveValue('roles');
    expect(createButton()).toBeEnabled();
  });

  test('creates an unpinned policy without adding subjects', async () => {
    const user = userEvent.setup();
    const { onCreate, onClose } = renderModal('platform/team-a/');
    fillDetails();
    await user.click(nextButton());
    expect(screen.getByText(PolicySubjectsI18nKey.Empty)).toBeInTheDocument();
    await user.click(createButton());
    expect(onClose).toHaveBeenCalledOnce();
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ folderId: 'platform/team-a/', costObject: undefined }),
    );
  });

  test('blocks creation for an incomplete rule and allows it after removal', async () => {
    const user = userEvent.setup();
    const { onCreate, onClose } = renderModal('platform/team-a/');
    fillDetails();
    await user.click(nextButton());
    expect(createButton()).toBeEnabled();
    await user.click(screen.getByRole('button', { name: PolicySubjectsI18nKey.AddRule }));
    expect(createButton()).toBeDisabled();
    expect(onCreate).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: PolicySubjectsI18nKey.RemoveRule }));
    expect(createButton()).toBeEnabled();
    await user.click(createButton());
    expect(onClose).toHaveBeenCalledOnce();
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'policy-one', subject: undefined, costObject: undefined }),
    );
  });

  test.each([
    ['platform/team-a/', 'team-a'],
    ['platform/', undefined],
  ])('uses the selected folder to pin subjects for %s', async (filePath, costObject) => {
    const user = userEvent.setup();
    const { onCreate, onClose } = renderModal(filePath);
    fillDetails();
    await user.click(nextButton());
    await addValidRule(user);
    expect(createButton()).toBeEnabled();
    await user.click(createButton());
    expect(onClose).toHaveBeenCalledOnce();
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        folderId: filePath,
        costObject,
        subject: [{ source: 'roles', function: PolicySubjectFunction.EQUAL, targets: ['admin'] }],
      }),
    );
  });

  test('unpins subjects when the folder is cleared after going Back', async () => {
    const user = userEvent.setup();
    const { onCreate, onClose } = renderModal('platform/team-a/');
    fillDetails();
    await user.click(nextButton());
    await addValidRule(user);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Back }));
    await user.clear(costObjectInput());
    await user.click(nextButton());
    await user.click(createButton());
    expect(onClose).toHaveBeenCalledOnce();
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        folderId: 'platform/',
        costObject: undefined,
        subject: [{ source: 'roles', function: PolicySubjectFunction.EQUAL, targets: ['admin'] }],
      }),
    );
  });

  test('uses the changed folder when returning to subjects', async () => {
    const user = userEvent.setup();
    const { onCreate, onClose } = renderModal('platform/team-a/');
    fillDetails();
    await user.click(nextButton());
    await addValidRule(user);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Back }));
    fireEvent.change(costObjectInput(), { target: { value: 'team-b' } });
    await user.click(nextButton());
    await user.click(createButton());
    expect(onClose).toHaveBeenCalledOnce();
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        folderId: 'team-b/',
        costObject: 'team-b',
        subject: [{ source: 'roles', function: PolicySubjectFunction.EQUAL, targets: ['admin'] }],
      }),
    );
  });
});
