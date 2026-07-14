import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import CategorizedFieldDropdown from '@/src/components/Analytics/QueryBuilder/Common/CategorizedFieldDropdown';
import ChipRow from '@/src/components/Analytics/QueryBuilder/Common/ChipRow';
import FieldChip from '@/src/components/Analytics/QueryBuilder/Common/FieldChip';

describe('QueryBuilder :: ChipRow', () => {
  test('renders expanded editor by default and collapses to a summary chip', async () => {
    const user = userEvent.setup();
    render(
      <ChipRow summary="sum(total_price)" onRemove={vi.fn()}>
        <span>editor body</span>
      </ChipRow>,
    );

    expect(screen.getByText('editor body')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /sum\(total_price\)/ }));

    expect(screen.queryByText('editor body')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sum\(total_price\)/ })).toHaveAttribute('aria-expanded', 'false');
  });

  test('expands back from the collapsed summary', async () => {
    const user = userEvent.setup();
    render(
      <ChipRow summary="cond" onRemove={vi.fn()} defaultExpanded={false}>
        <span>editor body</span>
      </ChipRow>,
    );

    expect(screen.queryByText('editor body')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cond/ }));

    expect(screen.getByText('editor body')).toBeInTheDocument();
  });

  test('fires onRemove in both states', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <ChipRow summary="cond" onRemove={onRemove} defaultExpanded={false}>
        <span>editor body</span>
      </ChipRow>,
    );

    await user.click(screen.getByRole('button', { name: 'Buttons.Remove' }));
    expect(onRemove).toHaveBeenCalled();
  });
});

describe('QueryBuilder :: ChipRow outside-click', () => {
  test('clicking outside the expanded item collapses it to the summary chip', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button>elsewhere</button>
        <ChipRow summary="sum(total_price)" onRemove={vi.fn()}>
          <span>editor body</span>
        </ChipRow>
      </div>,
    );

    expect(screen.getByText('editor body')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'elsewhere' }));

    expect(screen.queryByText('editor body')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sum\(total_price\)/ })).toHaveAttribute('aria-expanded', 'false');
  });

  test('interacting with the item’s own dropdown overlay does not collapse it', async () => {
    const user = userEvent.setup();
    render(
      <ChipRow summary="cond" onRemove={vi.fn()}>
        <CategorizedFieldDropdown
          id="in-row"
          options={[{ name: 'deployment', type: 'string', tag: 'dimension' }]}
          onSelect={vi.fn()}
          value=""
          placeholder="pick"
          ariaLabel="Pick field"
        />
      </ChipRow>,
    );

    await user.click(screen.getByRole('button', { name: 'Pick field' }));
    await user.click(screen.getByRole('button', { name: /dimension/ }));
    await user.click(screen.getByRole('option', { name: /deployment/ }));

    expect(screen.getByRole('button', { name: 'Pick field' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cond/ })).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('QueryBuilder :: FieldChip', () => {
  test('renders label and fires onRemove', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<FieldChip label="deployment" onRemove={onRemove} />);

    expect(screen.getByText('deployment')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /deployment/ }));
    expect(onRemove).toHaveBeenCalled();
  });
});
