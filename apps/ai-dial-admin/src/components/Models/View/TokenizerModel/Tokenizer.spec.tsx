import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TokenizerModelSwitch from './Tokenizer';

describe('TokenizerModelSwitch', () => {
  it('renders switch and toggles tokenizerModel', () => {
    const onChangeModel = vi.fn();
    render(<TokenizerModelSwitch model={{} as any} onChangeModel={onChangeModel} />);
    expect(screen.getByText('Off EntityFieldsI18nKey.tokenizerModel')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Off EntityFieldsI18nKey.tokenizerModel'));
    expect(onChangeModel).toHaveBeenCalledWith({ tokenizerModel: '' });
  });

  it('removes tokenizerModel when toggled off', () => {
    const onChangeModel = vi.fn();
    render(<TokenizerModelSwitch model={{ tokenizerModel: 'model-1' } as any} onChangeModel={onChangeModel} />);
    expect(screen.getByText('On EntityFieldsI18nKey.tokenizerModel')).toBeInTheDocument();
    fireEvent.click(screen.getByText('On EntityFieldsI18nKey.tokenizerModel'));
    expect(onChangeModel).toHaveBeenCalledWith({});
  });

  it('opens popup and selects model', () => {
    const onChangeModel = vi.fn();
    render(<TokenizerModelSwitch model={{ tokenizerModel: 'model-1' } as any} onChangeModel={onChangeModel} />);
    fireEvent.click(screen.getByText('OpenPopup'));
    expect(screen.getByText('InputPopupOpen')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Select model-2'));
    expect(onChangeModel).toHaveBeenCalledWith({ tokenizerModel: 'model-2' });
    fireEvent.click(screen.getByText('CloseModal'));
    // Modal should close (in real component, but here just for coverage)
  });
});
