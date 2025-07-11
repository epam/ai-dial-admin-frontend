import { PopUpState } from '@/src/types/pop-up';
import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import TokenizedModelsGrid from './TokenizedModelsGrid';
import TokenizedModelsModal from './TokenizedModelsModal';
import TokenizerModelSwitch from './Tokenizer';

vi.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, vi.fn()],
  useDrop: () => [{ isOver: false }, vi.fn()],
}));

const mockFunction = vi.fn();

describe('Tokenizer - Tokenizer Model Switch', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <TokenizerModelSwitch model={{ tokenizerModel: 'tokenizerModel ' }} onChangeModel={mockFunction} />,
    );
    expect(baseElement).toBeTruthy();
  });
});

describe('Tokenizer - TokenizedModelsGrid', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<TokenizedModelsGrid selectedModel="model" onSelectModelId={mockFunction} />);
    expect(baseElement).toBeTruthy();
  });
});

describe('Tokenizer - TokenizedModelsModal', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <TokenizedModelsModal
        model={{}}
        modalState={PopUpState.Opened}
        onClose={mockFunction}
        onSelectModelId={mockFunction}
      />,
    );
    expect(baseElement).toBeTruthy();
  });
});
