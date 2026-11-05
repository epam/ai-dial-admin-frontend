import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';

import SubjectRulesEditor from '@/src/components/Assets/Platform/PolicySubjects/SubjectRulesEditor';
import { PolicySubjectsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { PolicySubjectFunction, PolicySubjectRule } from '@/src/models/dial/policy';

const EQUAL_RULE: PolicySubjectRule = { source: 'roles', function: PolicySubjectFunction.EQUAL, targets: ['admin'] };

const renderEditor = (rules?: PolicySubjectRule[], onChange = vi.fn()) => {
  render(<SubjectRulesEditor rules={rules} onChange={onChange} />);
  return onChange;
};

describe('SubjectRulesEditor', () => {
  test('explains that a subject is pinned by the policy or the assignment, never both', () => {
    renderEditor();

    expect(screen.getByText(PolicySubjectsI18nKey.Pinned)).toBeTruthy();
  });

  test('shows the empty hint and no rule group while there are no rules', () => {
    renderEditor([]);

    expect(screen.getByText(PolicySubjectsI18nKey.Empty)).toBeTruthy();
    expect(screen.queryByRole('group')).toBeNull();
  });

  test('adds an empty EQUAL rule', async () => {
    const user = userEvent.setup();
    const onChange = renderEditor([]);

    await user.click(screen.getByRole('button', { name: PolicySubjectsI18nKey.AddRule }));

    expect(onChange).toHaveBeenCalledWith([{ source: '', function: PolicySubjectFunction.EQUAL, targets: [] }]);
  });

  test('renders one labelled group per rule', () => {
    renderEditor([EQUAL_RULE, { ...EQUAL_RULE, source: 'groups' }]);

    expect(screen.getAllByRole('group', { name: PolicySubjectsI18nKey.Rule })).toHaveLength(2);
  });

  test('writes the typed source into the rule', () => {
    const onChange = renderEditor([EQUAL_RULE]);

    fireEvent.change(screen.getByRole('textbox', { name: new RegExp(PolicySubjectsI18nKey.Source) }), {
      target: { value: 'realm_access.roles' },
    });

    expect(onChange).toHaveBeenCalledWith([{ ...EQUAL_RULE, source: 'realm_access.roles' }]);
  });

  test('reports undefined, not an empty list, when the last rule is removed', async () => {
    const user = userEvent.setup();
    const onChange = renderEditor([EQUAL_RULE]);

    await user.click(screen.getByRole('button', { name: PolicySubjectsI18nKey.RemoveRule }));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  test('keeps the other rules when one is removed', async () => {
    const user = userEvent.setup();
    const second = { ...EQUAL_RULE, source: 'groups' };
    const onChange = renderEditor([EQUAL_RULE, second]);

    await user.click(screen.getAllByRole('button', { name: PolicySubjectsI18nKey.RemoveRule })[0]);

    expect(onChange).toHaveBeenCalledWith([second]);
  });

  test('asks for a target when the function uses them', () => {
    renderEditor([{ ...EQUAL_RULE, targets: [] }]);

    expect(screen.getByText(PolicySubjectsI18nKey.TargetsRequired)).toBeTruthy();
  });

  test('shows no target error once a target is entered', () => {
    renderEditor([EQUAL_RULE]);

    expect(screen.queryByText(PolicySubjectsI18nKey.TargetsRequired)).toBeNull();
  });

  test.each([PolicySubjectFunction.TRUE, PolicySubjectFunction.FALSE])(
    'does not ask for a target for %s, which takes none',
    (fn) => {
      renderEditor([{ source: 'roles', function: fn, targets: [] }]);

      expect(screen.queryByText(PolicySubjectsI18nKey.TargetsRequired)).toBeNull();
    },
  );

  test('tells the user a TRUE rule takes no targets', () => {
    renderEditor([{ source: 'roles', function: PolicySubjectFunction.TRUE, targets: [] }]);

    expect(screen.getByText(PolicySubjectsI18nKey.TargetsNotUsed)).toBeTruthy();
  });

  describe('for a read-only admin', () => {
    afterEach(() => {
      useAppContext().isReadOnlyAdmin = false;
    });

    test('offers neither add nor remove, and disables the source field', () => {
      useAppContext().isReadOnlyAdmin = true;
      renderEditor([EQUAL_RULE]);

      expect(screen.queryByRole('button', { name: PolicySubjectsI18nKey.AddRule })).toBeNull();
      expect(screen.queryByRole('button', { name: PolicySubjectsI18nKey.RemoveRule })).toBeNull();
      expect(
        (screen.getByRole('textbox', { name: new RegExp(PolicySubjectsI18nKey.Source) }) as HTMLInputElement).disabled,
      ).toBe(true);
    });
  });
});
