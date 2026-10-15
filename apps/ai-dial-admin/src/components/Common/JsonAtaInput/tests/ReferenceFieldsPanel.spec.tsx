import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JSONSchema7 } from 'json-schema';
import { describe, expect, test, vi } from 'vitest';

import { JsonAtaI18nKey } from '@/src/constants/i18n';
import ReferenceFieldsPanel from '../ReferenceFieldsPanel';

const responseSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    usage: { type: 'object', properties: { total_tokens: { type: 'integer' } } },
  },
};

const rowButton = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) });

describe('ReferenceFieldsPanel', () => {
  const renderPanel = () => {
    const onSelect = vi.fn();
    render(<ReferenceFieldsPanel responseSchema={responseSchema} onSelect={onSelect} />);
    return { onSelect, user: userEvent.setup() };
  };

  test('starts expanded with the label, the tree and the collapse button', () => {
    renderPanel();

    expect(screen.getByText(JsonAtaI18nKey.ReferenceFields)).toBeTruthy();
    expect(rowButton('usage')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: JsonAtaI18nKey.CollapseReferenceFields }).getAttribute('aria-expanded'),
    ).toBe('true');
    expect(screen.queryByRole('button', { name: JsonAtaI18nKey.ExpandReferenceFields })).toBeNull();
  });

  test('forwards a picked node to onSelect', async () => {
    const { onSelect, user } = renderPanel();

    await user.click(rowButton('id'));

    expect(onSelect).toHaveBeenCalledWith({ expression: 'id', type: 'STRING' });
  });

  test('collapses to a rail with an expand button that controls the inert tree region', async () => {
    const { user } = renderPanel();
    const collapse = screen.getByRole('button', { name: JsonAtaI18nKey.CollapseReferenceFields });
    const regionId = collapse.getAttribute('aria-controls') as string;

    await user.click(collapse);

    const expand = screen.getByRole('button', { name: JsonAtaI18nKey.ExpandReferenceFields });
    expect(expand.getAttribute('aria-expanded')).toBe('false');
    expect(expand.getAttribute('aria-controls')).toBe(regionId);
    expect(document.getElementById(regionId)?.hasAttribute('inert')).toBe(true);
  });

  test('restores the tree with its expansion and selection when expanded again', async () => {
    const { user } = renderPanel();

    await user.click(rowButton('usage'));
    await user.click(screen.getByRole('button', { name: JsonAtaI18nKey.CollapseReferenceFields }));
    await user.click(screen.getByRole('button', { name: JsonAtaI18nKey.ExpandReferenceFields }));

    expect(rowButton('total_tokens')).toBeTruthy();
    expect(rowButton('usage').getAttribute('aria-current')).toBe('true');
    expect(
      document
        .getElementById(
          screen
            .getByRole('button', { name: JsonAtaI18nKey.CollapseReferenceFields })
            .getAttribute('aria-controls') as string,
        )
        ?.hasAttribute('inert'),
    ).toBe(false);
  });
});
