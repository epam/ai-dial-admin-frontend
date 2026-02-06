import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

import Item from '@/src/components/Deployments/Common/ItemsList/Item';

describe('Common Item component', () => {
  const onChange = vi.fn();
  const onRemove = vi.fn();
  const user = userEvent.setup();

  test('component rendered correctly', () => {
    render(<Item item={'item'} index={1} onChange={onChange} onRemove={onRemove} isModal={false} disabled={false} />);

    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  test('onChange called', async () => {
    const validate = vi.fn();
    render(
      <Item
        item={''}
        index={1}
        onChange={onChange}
        onRemove={onRemove}
        isModal={false}
        disabled={false}
        validate={validate}
      />,
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();

    await user.click(input);
    await user.paste('new-item');

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('new-item', 1);
      expect(validate).toHaveBeenCalled();
    });
  });

  test('onRemove called', async () => {
    render(<Item item={''} index={1} onChange={onChange} onRemove={onRemove} isModal={false} disabled={false} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();

    await user.click(button);

    await waitFor(() => {
      expect(onRemove).toHaveBeenCalledWith(1);
    });
  });
});
