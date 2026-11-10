import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { RouterDecision } from '@/src/models/dial/router';
import DecisionSettings from '../DecisionSettings';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

const renderSettings = (decision?: RouterDecision, onChange = vi.fn()) =>
  render(<DecisionSettings decision={decision} onChange={onChange} />);

const timeoutInput = () => screen.getByRole('spinbutton', { name: EntityFieldsI18nKey.routerDecisionTimeoutMs });
const maxDecisionsInput = () =>
  screen.getByRole('spinbutton', { name: EntityFieldsI18nKey.routerDecisionMaxDecisions });

describe('DecisionSettings', () => {
  test('shows Core defaults as placeholders and no values for an empty decision', () => {
    renderSettings();

    expect(timeoutInput()).toHaveValue(null);
    expect(timeoutInput()).toHaveAttribute('placeholder', EntityFieldsI18nKey.routerDecisionTimeoutMsPlaceholder);
    expect(maxDecisionsInput()).toHaveValue(null);
  });

  test('writes a typed timeout and keeps other settings', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSettings({ body: true }, onChange);

    await user.type(timeoutInput(), '2');

    expect(onChange).toHaveBeenLastCalledWith({ body: true, timeoutMs: 2 });
  });

  test('toggling the body switch writes it, and switching it off removes it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSettings({ body: true }, onChange);

    await user.click(screen.getByRole('switch', { name: EntityFieldsI18nKey.routerDecisionBody }));

    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  test('shows an error for a non-positive timeout', () => {
    renderSettings({ timeoutMs: 0 });

    expect(screen.getByText(EntityFieldsI18nKey.routerDecisionTimeoutMsError)).toBeInTheDocument();
  });

  test.each([0, 11])('shows an error for maxDecisions of %s', (maxDecisions) => {
    renderSettings({ maxDecisions });

    expect(screen.getByText(EntityFieldsI18nKey.routerDecisionMaxDecisionsError)).toBeInTheDocument();
  });

  test('shows no error for in-range values', () => {
    renderSettings({ timeoutMs: 5000, maxDecisions: 10 });

    expect(screen.queryByText(EntityFieldsI18nKey.routerDecisionTimeoutMsError)).toBeNull();
    expect(screen.queryByText(EntityFieldsI18nKey.routerDecisionMaxDecisionsError)).toBeNull();
  });
});
